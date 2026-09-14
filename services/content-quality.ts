import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';

export async function refreshContentQuality(contentType: 'question'|'dsa_problem', contentId: string) {
  const admin = createAdminSupabaseClient();
  const reports = await admin.from('content_reports').select('id',{count:'exact',head:true}).eq('content_type',contentType).eq('content_id',contentId);
  const reportCount = reports.count ?? 0;
  if (contentType === 'question') {
    const rows = await admin.from('test_answers').select('is_correct').eq('question_id', contentId);
    if (rows.error) throw new Error(rows.error.message);
    const answers = rows.data ?? []; const attempts = answers.length; const successful = answers.filter((x:any)=>x.is_correct === true).length;
    const successRate = attempts ? successful / attempts : 0;
    const quality = attempts < 3 ? 50 : Math.max(0, Math.min(100, Math.round(82 - Math.abs(successRate - 0.65) * 80 - reportCount * 7)));
    const { data, error } = await admin.from('content_quality_metrics').upsert({content_type:'question',content_id:contentId,attempts,successful_attempts:successful,report_count:reportCount,quality_score:quality,last_calculated_at:new Date().toISOString()},{onConflict:'content_type,content_id'}).select('*').single();
    if (error) throw new Error(error.message); return data;
  }
  const rows = await admin.from('dsa_submissions').select('status').eq('problem_id', contentId);
  if (rows.error) throw new Error(rows.error.message);
  const submissions = rows.data ?? []; const attempts = submissions.length; const successful = submissions.filter((x:any)=>['accepted','passed','success'].includes(String(x.status).toLowerCase())).length;
  const successRate = attempts ? successful / attempts : 0;
  const quality = attempts < 3 ? 50 : Math.max(0, Math.min(100, Math.round(82 - Math.abs(successRate - 0.55) * 80 - reportCount * 7)));
  const { data, error } = await admin.from('content_quality_metrics').upsert({content_type:'dsa_problem',content_id:contentId,attempts,successful_attempts:successful,report_count:reportCount,quality_score:quality,last_calculated_at:new Date().toISOString()},{onConflict:'content_type,content_id'}).select('*').single();
  if (error) throw new Error(error.message); return data;
}
