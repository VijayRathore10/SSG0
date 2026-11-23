import { getDbSiteSettings, saveDbSiteSettings } from '@/lib/db';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const settings = await getDbSiteSettings();
  return Response.json(settings, { headers: { 'Cache-Control': 'no-store' } });
}

async function handleSave(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  try {
    const data = await request.json();
    const saved = await saveDbSiteSettings(data);
    return Response.json(saved, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to save settings' }, { status: 500 });
  }
}

export async function POST(request) {
  return handleSave(request);
}

export async function PUT(request) {
  return handleSave(request);
}
