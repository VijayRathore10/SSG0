import { getDbProducts, saveDbProduct, deleteDbProduct } from '@/lib/db';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const products = await getDbProducts();
  return Response.json(products, { headers: { 'Cache-Control': 'no-store' } });
}

async function handleUpsert(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  try {
    const productData = await request.json();
    if (!productData?.name) {
      return Response.json({ error: 'Product name is required' }, { status: 400 });
    }

    const saved = await saveDbProduct(productData);
    return Response.json(saved, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to save product' }, { status: 500 });
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
      return Response.json({ error: 'Missing product ID' }, { status: 400 });
    }

    await deleteDbProduct(id);
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to delete product' }, { status: 500 });
  }
}
