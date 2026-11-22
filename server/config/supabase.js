const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  console.log('⚡ Supabase Client initialized successfully.');
} else {
  console.warn('⚠️ Supabase credentials (SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY) not provided.');
}

/**
 * Upload an image buffer to Supabase Storage bucket 'question-images'
 * @param {Buffer} fileBuffer 
 * @param {string} fileName 
 * @param {string} mimeType 
 * @returns {Promise<string>} Public URL of the uploaded image
 */
async function uploadQuestionImage(fileBuffer, fileName, mimeType) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const uniqueName = `question-${Date.now()}-${fileName}`;
  const { data, error } = await supabase.storage
    .from('question-images')
    .upload(uniqueName, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: publicData } = supabase.storage
    .from('question-images')
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

module.exports = {
  supabase,
  uploadQuestionImage,
};
