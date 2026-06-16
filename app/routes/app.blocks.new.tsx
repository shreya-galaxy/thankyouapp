import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import prisma from "../db.server";
import { authenticateAdmin } from "../shopify.server";
import { ThankYouBlockEditor } from "../components/ThankYouBlockEditor";

import {
  blockTemplates,
  configFromForm,
  isBlockType,
  type ThankYouBlockConfig,
} from "../models/thankYouBlock";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { redirect } = await authenticateAdmin(request);
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  if (!isBlockType(type)) {
    return redirect("/app/blocks");
  }

  const template = blockTemplates[type];

  return {
    type,
    name: template.defaultName,
    status: "draft",
    config: template.defaultConfig as ThankYouBlockConfig,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, redirect } = await authenticateAdmin(request);
  if (!session?.shop) {
    const wantsJson = request.headers.get("accept")?.includes("application/json");
    if (wantsJson) {
      return responseJson({ success: false, message: "Not authenticated." }, 401);
    }

    return redirect("/auth/login");
  }
  const wantsJson = request.headers.get("accept")?.includes("application/json");

  const formData = await request.formData();
  const type = formData.get("type");

  if (!isBlockType(type)) {
    if (wantsJson) {
      return responseJson(
        {success: false, message: "Invalid block type."},
        400,
      );
    }

    return redirect("/app/blocks");
  }

  try {
    const block = await prisma.thankYouBlock.create({
      data: {
        shop: session.shop,
        type,
        name:
          field(formData, "name") ||
          blockTemplates[type].defaultName,
        status:
          field(formData, "status") === "active"
            ? "active"
            : "draft",
        config: JSON.stringify(configFromForm(type, formData)),
      },
    });

    const redirectTo = `/app/blocks/${block.id}`;

    if (wantsJson) {
      return responseJson({success: true, redirectTo});
    }

    return redirect(redirectTo);
  } catch (error) {
    console.error("SAVE ERROR:", error);
    if (wantsJson) {
      return responseJson(
        {success: false, message: "Could not save block."},
        500,
      );
    }

    return redirect("/app/blocks");
  }
};

export default function NewBlockPage() {
  const { type, name, status, config } = useLoaderData<typeof loader>();

  return (
    <ThankYouBlockEditor
      type={type}
      name={name}
      status={status}
      config={config}
      mode="create"
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
