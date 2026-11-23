import { getDbTestimonials, saveDbTestimonial, deleteDbTestimonial } from '@/lib/db';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  const testimonials = await getDbTestimonials();
  return Response.json(testimonials, { headers: { 'Cache-Control': 'no-store' } });
}

async function handleUpsert(request) {
  if (!(await isAdminAuthenticated(request))) {
    return unauthorizedResponse();
  }

  try {
    const data = await request.json();
    if (!data?.customerName || !data?.quote) {
      return Response.json({ error: 'Customer name and quote are required' }, { status: 400 });
    }
    const saved = await saveDbTestimonial(data);
    return Response.json(saved, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to save testimonial' }, { status: 500 });
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
      return Response.json({ error: 'Missing testimonial ID' }, { status: 400 });
    }

    await deleteDbTestimonial(id);
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to delete testimonial' }, { status: 500 });
  }
}
