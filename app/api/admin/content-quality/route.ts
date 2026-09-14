import { jsonError, jsonOk } from '@/services/http';
import { requireAdmin } from '@/services/auth';
import { refreshContentQuality } from '@/services/content-quality';

export async function POST(request: Request){
  await requireAdmin();
  try { const body=await request.json(); const type=body.contentType==='dsa_problem'?'dsa_problem':'question'; const id=String(body.contentId??''); if(!id)return jsonError('contentId is required'); return jsonOk({metrics:await refreshContentQuality(type,id)}); }
  catch(error){ return jsonError(error instanceof Error?error.message:'Unable to refresh content quality',400); }
}
