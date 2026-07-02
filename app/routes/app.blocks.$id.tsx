import type {ActionFunctionArgs, LoaderFunctionArgs} from "react-router";
import {useLoaderData} from "react-router";
import prisma from "../db.server";
import {authenticateAdmin} from "../shopify.server";
import {ThankYouBlockEditor} from "../components/ThankYouBlockEditor";
import {
  configFromForm,
  isBlockType,
  parseBlockConfig,
  validateBlockForm,
} from "../models/thankYouBlock";

export const loader = async ({params, request}: LoaderFunctionArgs) => {
  const {session, redirect} = await authenticateAdmin(request);
  if (!session?.shop) {
    return redirect("/auth/login");
  }
  const block = await prisma.thankYouBlock.findFirst({
    where: {
      id: params.id,
      shop: session.shop,
    },
  });

  if (!block || !isBlockType(block.type)) {
    return redirect("/app/blocks");
  }

  return {
    id: block.id,
    type: block.type,
    name: block.name,
    status: block.status,
    config: parseBlockConfig(block.config),
  };
};

export const action = async ({params, request}: ActionFunctionArgs) => {
  const {session, redirect} = await authenticateAdmin(request);
  if (!session?.shop) {
    const wantsJson = request.headers.get("accept")?.includes("application/json");
    if (wantsJson) {
      return responseJson({success: false, message: "Not authenticated."}, 401);
    }

    return redirect("/auth/login");
  }
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  const formData = await request.formData();
  const type = formData.get("type");

  if (!params.id || !isBlockType(type)) {
    if (wantsJson) {
      return responseJson(
        {success: false, message: "Invalid block."},
        400,
      );
    }

    return redirect("/app/blocks");
  }

  const validation = validateBlockForm(type, formData);

  if (!validation.success) {
    if (wantsJson) {
      return responseJson(
        {success: false, message: validation.message, errors: validation.errors},
        400,
      );
    }

    return redirect(`/app/blocks/${params.id}`);
  }

  try {
    const duplicateBlock = await prisma.thankYouBlock.findFirst({
      where: {
        shop: session.shop,
        type,
        id: {
          not: params.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateBlock) {
      const message =
        "This extension has already been added. Delete the duplicate block before saving.";

      if (wantsJson) {
        return responseJson(
          {success: false, message, redirectTo: `/app/blocks/${duplicateBlock.id}`},
          409,
        );
      }

      return redirect(`/app/blocks/${duplicateBlock.id}`);
    }

    await prisma.thankYouBlock.updateMany({
      where: {
        id: params.id,
        shop: session.shop,
      },
      data: {
        name: field(formData, "name"),
        status: field(formData, "status") === "active" ? "active" : "draft",
        config: JSON.stringify(configFromForm(type, formData)),
      },
    });

    const redirectTo = `/app/blocks/${params.id}`;

    if (wantsJson) {
      return responseJson({success: true, redirectTo});
    }

    return redirect(redirectTo);
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    if (wantsJson) {
      return responseJson(
        {success: false, message: "Could not save block."},
        500,
      );
    }

    return redirect("/app/blocks");
  }
};

export default function EditBlockPage() {
  const block = useLoaderData<typeof loader>();

  return (
    <ThankYouBlockEditor
      blockId={block.id}
      type={block.type}
      name={block.name}
      status={block.status}
      config={block.config}
      mode="edit"
    />
  );
}

function field(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function responseJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type": "application/json"},
  });
}
