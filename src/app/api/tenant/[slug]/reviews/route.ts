import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDealershipBySlug } from "@/lib/tenant";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const dealership = await getDealershipBySlug(slug);

    if (!dealership) {
      return NextResponse.json(
        { error: "Concesionaria no encontrada" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, content, rating } = body;

    if (!name || !content || !rating) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        dealershipId: dealership.id,
        name,
        content,
        rating: Number(rating),
        status: "pending", // Todas entran como pendientes por seguridad
      },
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error("[REVIEW_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
