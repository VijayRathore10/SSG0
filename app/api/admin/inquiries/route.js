import { getDbInquiries, deleteDbInquiry } from '@/lib/db';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const inquiries = await getDbInquiries();
  return Response.json(inquiries, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return Response.json({ error: 'Missing inquiry ID' }, { status: 400 });
    }

    await deleteDbInquiry(id);
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to delete inquiry' }, { status: 500 });
  }
}
