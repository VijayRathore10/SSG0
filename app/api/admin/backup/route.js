import { getRawDatabase, restoreDatabase } from '@/lib/db';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const raw = await getRawDatabase();
  return new Response(JSON.stringify(raw, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="nikexports-backup-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}

export async function POST(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  try {
    const data = await request.json();
    await restoreDatabase(data);
    return Response.json(
      { success: true, message: 'Database successfully restored from backup' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return Response.json(
      { error: err.message || 'Failed to restore database' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
