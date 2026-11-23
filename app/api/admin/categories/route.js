import { getDbCategories, saveDbCategory, deleteDbCategory } from '@/lib/db';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const categories = await getDbCategories();
  return Response.json(categories, { headers: { 'Cache-Control': 'no-store' } });
}

async function handleUpsert(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  try {
    const data = await request.json();
    if (!data?.title) {
      return Response.json({ error: 'Category title is required' }, { status: 400 });
    }
    const saved = await saveDbCategory(data);
    return Response.json(saved, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to save category' }, { status: 500 });
  }
}

export async function POST(request) {
  return handleUpsert(request);
}

export async function PUT(request) {
  return handleUpsert(request);
}

export async function DELETE(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return Response.json({ error: 'Missing category ID' }, { status: 400 });
    }

    await deleteDbCategory(id);
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to delete category' }, { status: 500 });
  }
}
