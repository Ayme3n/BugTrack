#!/usr/bin/env node
/**
 * BugTrack Runner Service
 * 
 * This service polls the database for queued tool jobs and executes them
 * using Docker containers. It runs locally on your machine and processes
 * jobs one at a time.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Docker = require('dockerode');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgyeakdpdapxjiwrxbmf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const docker = new Docker();

// Configuration
const POLL_INTERVAL = 5000; // Check for new jobs every 5 seconds
const JOB_TIMEOUT = 300000; // 5 minutes max per job
const IMAGE_PULL_TIMEOUT = 600000; // 10 minutes for pulling images (first time only)

// Tool configurations
const TOOL_CONFIGS = {
  SUBFINDER: {
    image: 'projectdiscovery/subfinder:latest',
    getArgs: (input, params) => ['-d', input, '-silent', '-all'],
    parseOutput: (stdout) => {
      const lines = stdout.trim().split('\n').filter(line => {
        // Filter out empty lines and any error/info messages
        return line && !line.startsWith('[') && line.length > 0;
      });
      console.log(`   📝 Parsed ${lines.length} subdomains from output`);
      return {
        subdomains: lines,
        count: lines.length
      };
    }
  },
  HTTPX: {
    image: 'projectdiscovery/httpx:latest',
    getArgs: (input, params) => ['-u', input, '-silent', '-json'],
    parseOutput: (stdout) => {
      const lines = stdout.trim().split('\n').filter(Boolean);
      return {
        results: lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { url: line };
          }
        }),
        count: lines.length
      };
    }
  },
  NUCLEI: {
    image: 'projectdiscovery/nuclei:latest',
    getArgs: (input, params) => [
      '-u', input,
      '-silent',
      '-jsonl',
      ...(params?.severity ? ['-severity', params.severity] : [])
    ],
    parseOutput: (stdout) => {
      if (!stdout || !stdout.trim()) {
        return { vulnerabilities: [], count: 0 };
      }
      
      const lines = stdout.trim().split('\n').filter(Boolean);
      const vulnerabilities = lines.map(line => {
        try {
          const parsed = JSON.parse(line);
          // Only return valid JSON objects that aren't error messages
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
          return { raw: line };
        } catch {
          // For non-JSON lines, return them as raw text
          return { raw: line };
        }
      }).filter(v => {
        // Safely filter out error messages containing "flag provided"
        if (typeof v.info === 'string' && v.info.includes('flag provided')) {
          return false;
        }
        return true;
      });
      
      return {
        vulnerabilities,
        count: vulnerabilities.length
      };
    }
  }
};

/**
 * Main worker loop - polls database for jobs
 */
async function startWorker() {
  console.log('🚀 BugTrack Runner started');
  console.log(`📊 Polling every ${POLL_INTERVAL / 1000}s`);
  console.log(`⏱️  Job timeout: ${JOB_TIMEOUT / 1000}s`);
  console.log('');

  while (true) {
    try {
      // Get next queued job using Supabase
      const { data: jobs, error } = await supabase
        .from('tool_jobs')
        .select('*')
        .eq('status', 'QUEUED')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) {
        console.error('❌ Database query error:', error);
        throw error;
      }

      if (jobs && jobs.length > 0) {
        console.log(`📥 Found ${jobs.length} queued job(s)`);
        await executeJob(jobs[0]);
      } else {
        // No jobs, wait before next poll
        console.log('💤 No queued jobs, waiting...');
        await sleep(POLL_INTERVAL);
      }
    } catch (error) {
      console.error('❌ Worker error:', error.message);
      console.error('Full error:', error);
      await sleep(POLL_INTERVAL);
    }
  }
}

/**
 * Execute a single tool job
 */
async function executeJob(job) {
  const startTime = Date.now();
  console.log(`\n🔧 Starting job ${job.id}`);
  console.log(`   Tool: ${job.tool_name}`);
  console.log(`   Target: ${job.target_input}`);

  try {
    // Mark job as running
    await supabase
      .from('tool_jobs')
      .update({
        status: 'RUNNING',
        started_at: new Date().toISOString(),
        runner_node: require('os').hostname()
      })
      .eq('id', job.id);

    // Get tool configuration
    const toolConfig = TOOL_CONFIGS[job.tool_name];
    if (!toolConfig) {
      throw new Error(`Unknown tool: ${job.tool_name}`);
    }

    // Parse params
    const params = job.params_json || {};

    // Build Docker command
    const args = toolConfig.getArgs(job.target_input, params);
    
    console.log(`   Docker: ${toolConfig.image}`);
    console.log(`   Args: ${args.join(' ')}`);

    // Execute Docker container
    const result = await runDockerContainer(
      toolConfig.image,
      args,
      JOB_TIMEOUT
    );

    // Parse output
    const parsedOutput = toolConfig.parseOutput(result.stdout);
    const duration = Date.now() - startTime;

    // Update job with results
    await supabase
      .from('tool_jobs')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        duration_ms: duration,
        exit_code: result.exitCode,
        result_json: parsedOutput,
        result_count: parsedOutput.count || 0,
        raw_output: result.stdout.substring(0, 50000), // Limit to 50KB
        container_id: result.containerId
      })
      .eq('id', job.id);

    console.log(`   ✅ Completed in ${(duration / 1000).toFixed(1)}s`);
    console.log(`   📊 Results: ${parsedOutput.count || 0}`);

    // Create notification for user
    await createNotification(job.user_id, job, parsedOutput);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`   ❌ Failed: ${error.message}`);

    // Mark job as failed
    await supabase
      .from('tool_jobs')
      .update({
        status: 'FAILED',
        completed_at: new Date().toISOString(),
        duration_ms: duration,
        error_output: error.message
      })
      .eq('id', job.id);
  }
}

/**
 * Run a Docker container and capture output
 */
async function runDockerContainer(image, args, timeout) {
  return new Promise(async (resolve, reject) => {
    let timeoutHandle = null;

    try {
      // Pull image if it doesn't exist (no timeout during pull)
      try {
        await docker.getImage(image).inspect();
        console.log(`   ✓ Image ${image} already exists`);
      } catch (err) {
        console.log(`   📥 Pulling image ${image}... (this may take a few minutes)`);
        
        const pullTimeout = setTimeout(() => {
          reject(new Error(`Image pull timeout after ${IMAGE_PULL_TIMEOUT / 1000}s`));
        }, IMAGE_PULL_TIMEOUT);

        try {
          await new Promise((resolveStream, rejectStream) => {
            docker.pull(image, (err, stream) => {
              if (err) return rejectStream(err);
              
              docker.modem.followProgress(stream, (err, output) => {
                if (err) return rejectStream(err);
                console.log(`   ✓ Image ${image} pulled successfully`);
                resolveStream();
              });
            });
          });
          clearTimeout(pullTimeout);
        } catch (pullErr) {
          clearTimeout(pullTimeout);
          throw pullErr;
        }
      }

      // Now start the execution timeout (only for actual job execution)
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Job execution timeout after ${timeout / 1000}s`));
      }, timeout);

      // Create container
      const container = await docker.createContainer({
        Image: image,
        Cmd: args,
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
        HostConfig: {
          AutoRemove: false // Don't auto-remove so we can get logs
        }
      });

      // Start container
      await container.start();

      // Wait for container to finish
      const data = await container.wait();

      // Get logs
      const logStream = await container.logs({
        stdout: true,
        stderr: true,
        follow: false
      });

      let stdout = '';
      let stderr = '';

      // Parse Docker multiplexed stream
      let offset = 0;
      while (offset < logStream.length) {
        const header = logStream.readUInt8(offset);
        const size = logStream.readUInt32BE(offset + 4);
        
        const payload = logStream.toString('utf8', offset + 8, offset + 8 + size);
        
        if (header === 1) {
          stdout += payload;
        } else if (header === 2) {
          stderr += payload;
        }
        
        offset += 8 + size;
      }

      console.log(`   📊 Captured ${stdout.length} bytes of output`);
      console.log(`   📝 Lines captured: ${stdout.split('\n').filter(Boolean).length}`);

      // Remove container
      await container.remove();

      clearTimeout(timeoutHandle);

      resolve({
        exitCode: data.StatusCode,
        stdout,
        stderr,
        containerId: container.id
      });
    } catch (err) {
      clearTimeout(timeoutHandle);
      reject(err);
    }
  });
}

/**
 * Create a notification for the user
 */
async function createNotification(userId, job, result) {
  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'SYSTEM',
        title: `${job.tool_name} scan completed`,
        message: `Found ${result.count || 0} results for ${job.target_input}`,
        link_url: `/dashboard/tools/jobs/${job.id}`,
        icon: '🔍',
        metadata: {
          job_id: job.id,
          tool_name: job.tool_name,
          result_count: result.count || 0
        }
      });
  } catch (error) {
    console.error('   ⚠️  Failed to create notification:', error.message);
  }
}

/**
 * Helper: Sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down runner...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n👋 Shutting down runner...');
  process.exit(0);
});

// Start the worker
startWorker().catch(async (error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

