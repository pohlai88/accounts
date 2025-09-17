// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  RefreshCw,
  Package,
  Warehouse,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  Settings,
  BarChart3,
  FileText,
  Edit,
  Trash2,
  Database,
} from "lucide-react";
import {
  InventoryManagementService,
  Item,
  Warehouse as WarehouseInterface,
  CreateItemInput,
  CreateWarehouseInput,
} from "@/lib/inventory-management";
import { MetadataManagement } from "@/components/metadata/metadata-management";
import { format } from "date-fns";

interface InventoryManagementProps {
  companyId: string;
}

export function InventoryManagement({ companyId }: InventoryManagementProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseInterface[]>([]);
  const [stockSummary, setStockSummary] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateItemDialog, setShowCreateItemDialog] = useState(false);
  const [showCreateWarehouseDialog, setShowCreateWarehouseDialog] = useState(false);
  const [selectedItemForMetadata, setSelectedItemForMetadata] = useState<Item | null>(null);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);

  // Form states
  const [itemForm, setItemForm] = useState<CreateItemInput>({
    companyId,
    itemCode: "",
    itemName: "",
    description: "",
    unitOfMeasure: "Each",
    itemType: "Stock",
    isSellable: true,
    isPurchasable: true,
  });

  const [warehouseForm, setWarehouseForm] = useState<CreateWarehouseInput>({
    companyId,
    warehouseCode: "",
    warehouseName: "",
    address: "",
  });

  useEffect(() => {
    loadData();
  }, [companyId, selectedWarehouse]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadItems(), loadWarehouses(), loadStockSummary(), loadLowStockItems()]);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const result = await InventoryManagementService.getItems(companyId);
      if (result.success && result.items) {
        setItems(result.items);
      }
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const loadWarehouses = async () => {
    try {
      const result = await InventoryManagementService.getWarehouses(companyId);
      if (result.success && result.warehouses) {
        setWarehouses(result.warehouses);
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const loadStockSummary = async () => {
    try {
      const warehouseId = selectedWarehouse === "all" ? undefined : selectedWarehouse;
      const result = await InventoryManagementService.getStockSummary(companyId, warehouseId);
      if (result.success && result.stockSummary) {
        setStockSummary(result.stockSummary);
      }
    } catch (error) {
      console.error("Error loading stock summary:", error);
    }
  };

  const loadLowStockItems = async () => {
    try {
      const warehouseId = selectedWarehouse === "all" ? undefined : selectedWarehouse;
      const result = await InventoryManagementService.getLowStockItems(companyId, warehouseId);
      if (result.success && result.lowStockItems) {
        setLowStockItems(result.lowStockItems);
      }
    } catch (error) {
      console.error("Error loading low stock items:", error);
    }
  };

  const handleCreateItem = async () => {
    try {
      const result = await InventoryManagementService.createItem(itemForm);
      if (result.success) {
        setShowCreateItemDialog(false);
        setItemForm({
          companyId,
          itemCode: "",
          itemName: "",
          description: "",
          unitOfMeasure: "Each",
          itemType: "Stock",
          isSellable: true,
          isPurchasable: true,
        });
        loadData();
      }
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  const handleCreateWarehouse = async () => {
    try {
      const result = await InventoryManagementService.createWarehouse(warehouseForm);
      if (result.success) {
        setShowCreateWarehouseDialog(false);
        setWarehouseForm({
          companyId,
          warehouseCode: "",
          warehouseName: "",
          address: "",
        });
        loadData();
      }
    } catch (error) {
      console.error("Error creating warehouse:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getItemTypeColor = (itemType: string) => {
    switch (itemType) {
      case "Stock":
        return "text-blue-600 bg-blue-50";
      case "Service":
        return "text-green-600 bg-green-50";
      case "Consumable":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const filteredItems = items.filter(
    item =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredStockSummary = stockSummary.filter(
    item =>
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-muted-foreground">
            Track inventory levels, stock movements, and manage items
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showCreateItemDialog} onOpenChange={setShowCreateItemDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Item</DialogTitle>
                <DialogDescription>Add a new item to your inventory</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="itemCode">Item Code</Label>
                    <Input
                      id="itemCode"
                      value={itemForm.itemCode}
                      onChange={e => setItemForm(prev => ({ ...prev, itemCode: e.target.value }))}
                      placeholder="e.g., ITM-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemName">Item Name</Label>
                    <Input
                      id="itemName"
                      value={itemForm.itemName}
                      onChange={e => setItemForm(prev => ({ ...prev, itemName: e.target.value }))}
                      placeholder="e.g., Office Chair"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={itemForm.description}
                    onChange={e => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
                    <Select
                      value={itemForm.unitOfMeasure}
                      onValueChange={value =>
                        setItemForm(prev => ({ ...prev, unitOfMeasure: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Each">Each</SelectItem>
                        <SelectItem value="Kg">Kilogram</SelectItem>
                        <SelectItem value="Lb">Pound</SelectItem>
                        <SelectItem value="Box">Box</SelectItem>
                        <SelectItem value="Case">Case</SelectItem>
                        <SelectItem value="Meter">Meter</SelectItem>
                        <SelectItem value="Liter">Liter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="itemType">Item Type</Label>
                    <Select
                      value={itemForm.itemType}
                      onValueChange={value =>
                        setItemForm(prev => ({ ...prev, itemType: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stock">Stock Item</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                        <SelectItem value="Consumable">Consumable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateItemDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateItem}>Create Item</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.warehouseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Low Stock Alert</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.item_name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600">
                      {item.quantity_on_hand} / {item.reorder_level}
                    </span>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Reorder: {item.reorder_qty}
                    </Badge>
                  </div>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <div className="text-sm text-orange-600 font-medium">
                  +{lowStockItems.length - 5} more items need reordering
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Stock Summary</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
        </TabsList>

        {/* Stock Summary Tab */}
        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Summary</CardTitle>
              <CardDescription>Current inventory levels across all warehouses</CardDescription>
            </CardHeader>
            <CardContent>
              {stockSummary.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead className="text-right">On Hand</TableHead>
                        <TableHead className="text-right">Reserved</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStockSummary.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>{item.warehouse_name}</TableCell>
                          <TableCell className="text-right font-medium">
                            {item.quantity_on_hand}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {item.quantity_reserved}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.quantity_available}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total_value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Stock Data</h3>
                  <p className="text-muted-foreground">
                    No inventory items found. Create items and add stock to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>Manage your inventory items</CardDescription>
                </div>
                <Button onClick={() => setShowCreateItemDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredItems.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.itemCode}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.itemName}</div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getItemTypeColor(item.itemType)}>
                              {item.itemType}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.unitOfMeasure}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {item.isSellable && (
                                <Badge variant="outline" className="text-xs">
                                  Sellable
                                </Badge>
                              )}
                              {item.isPurchasable && (
                                <Badge variant="outline" className="text-xs">
                                  Purchasable
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedItemForMetadata(item);
                                  setShowMetadataDialog(true);
                                }}
                                title="View metadata"
                              >
                                <Database className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Items Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first inventory item to get started
                  </p>
                  <Button onClick={() => setShowCreateItemDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Warehouses</CardTitle>
                  <CardDescription>Manage your warehouse locations</CardDescription>
                </div>
                <Dialog
                  open={showCreateWarehouseDialog}
                  onOpenChange={setShowCreateWarehouseDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Warehouse
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Warehouse</DialogTitle>
                      <DialogDescription>Add a new warehouse location</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="warehouseCode">Warehouse Code</Label>
                          <Input
                            id="warehouseCode"
                            value={warehouseForm.warehouseCode}
                            onChange={e =>
                              setWarehouseForm(prev => ({ ...prev, warehouseCode: e.target.value }))
                            }
                            placeholder="e.g., WH-001"
                          />
                        </div>
                        <div>
                          <Label htmlFor="warehouseName">Warehouse Name</Label>
                          <Input
                            id="warehouseName"
                            value={warehouseForm.warehouseName}
                            onChange={e =>
                              setWarehouseForm(prev => ({ ...prev, warehouseName: e.target.value }))
                            }
                            placeholder="e.g., Main Warehouse"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={warehouseForm.address}
                          onChange={e =>
                            setWarehouseForm(prev => ({ ...prev, address: e.target.value }))
                          }
                          placeholder="Optional address"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateWarehouseDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateWarehouse}>Create Warehouse</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {warehouses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {warehouses.map(warehouse => (
                    <Card key={warehouse.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Warehouse className="h-8 w-8 text-blue-500" />
                          <div>
                            <div className="font-medium">{warehouse.warehouseName}</div>
                            <div className="text-sm text-muted-foreground">
                              {warehouse.warehouseCode}
                            </div>
                            {warehouse.address && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {warehouse.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Warehouses Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first warehouse to start managing inventory
                  </p>
                  <Button onClick={() => setShowCreateWarehouseDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Warehouse
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Metadata Management Dialog */}
      <Dialog open={showMetadataDialog} onOpenChange={setShowMetadataDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Governance - {selectedItemForMetadata?.itemName}</DialogTitle>
            <DialogDescription>
              Metadata management, data quality, and lineage tracking
            </DialogDescription>
          </DialogHeader>
          {selectedItemForMetadata && (
            <MetadataManagement
              companyId={companyId}
              entityType="Item"
              entityId={selectedItemForMetadata.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
