import { config as loadEnv } from 'dotenv';
import { higgsfield, config } from '@higgsfield/client/v2';

loadEnv({ path: '.env.local', quiet: true });

const credentials = process.env.HF_CREDENTIALS;
if (!credentials) {
  console.error('HF_CREDENTIALS is not set. Add it to .env.local as key-id:key-secret.');
  process.exit(1);
}
config({ credentials });

const jobSet = await higgsfield.subscribe('bytedance/seedance-2.5/text-to-video', {
  input: {
    prompt: 'A cinematic scene at sunset',
    duration: 5,
    resolution: '720p',
    aspect_ratio: '16:9',
  },
  withPolling: true,
});

const url = jobSet.jobs[0]?.results?.raw?.url;
if (jobSet.isCompleted && url) {
  console.log('Video URL:', url);
} else {
  const reason = jobSet.isNsfw ? 'moderated (NSFW)'
    : jobSet.isFailed ? 'failed'
    : jobSet.isCanceled ? 'canceled'
    : jobSet.isCompleted ? 'completed without a video URL'
    : 'did not complete';
  console.error(`Generation ${reason}. Request ID: ${jobSet.id}`);
  process.exit(1);
}
