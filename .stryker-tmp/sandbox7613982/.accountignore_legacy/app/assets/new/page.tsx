/**
 * New Asset Page - Create Fixed Asset
 */
// @ts-nocheck


"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AssetForm from "@/components/assets/AssetForm";
import { Asset } from "@/lib/fixed-assets-service";

export default function NewAssetPage() {
  const router = useRouter();

  const handleSave = (asset: Asset) => {
    // Redirect to asset details or list
    router.push(`/assets/${asset.id}`);
  };

  const handleCancel = () => {
    router.push("/assets");
  };

  return (
    <div className="container mx-auto p-6">
      <AssetForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
