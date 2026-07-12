export const toAssetDTO = (asset) => {
  if (!asset) return null;
  return {
    id: asset.id,
    assetTag: asset.assetTag,
    serialNumber: asset.serialNumber || null,
    assetName: asset.assetName,
    categoryId: asset.categoryId,
    category: asset.category ? { id: asset.category.id, name: asset.category.name } : null,
    departmentId: asset.departmentId || null,
    department: asset.department ? { id: asset.department.id, name: asset.department.name } : null,
    purchaseDate: asset.purchaseDate || null,
    purchaseCost: parseFloat(asset.purchaseCost || 0),
    warrantyExpiry: asset.warrantyExpiry || null,
    location: asset.location || null,
    condition: asset.condition,
    status: asset.status,
    qrCode: asset.qrCode || null,
    image: asset.image || null,
    isBookable: asset.isBookable,
    notes: asset.notes || null,
    createdAt: asset.createdAt,
  };
};

export const toAssetListDTO = (assets) => {
  if (!assets) return [];
  return assets.map(toAssetDTO);
};
