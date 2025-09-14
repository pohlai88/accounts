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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Receipt,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus as PlusIcon,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  Archive,
  AlertTriangle,
  TrendingDown,
  Box,
  Layers,
  MapPin,
  Scale,
  Tag,
} from "lucide-react";
import {
  InventoryService,
  Item,
  ItemGroup,
  UnitOfMeasure,
  Warehouse,
  StockEntry,
  Bin,
} from "@/lib/inventory-service";
import { format } from "date-fns";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Data states
  const [items, setItems] = useState<Item[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<UnitOfMeasure[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [inventoryStats, setInventoryStats] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("item_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const companyId = "default-company";

  useEffect(() => {
    loadData();
  }, [companyId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "overview":
          await loadInventoryStats();
          break;
        case "items":
          await loadItems();
          await loadItemGroups();
          await loadUnitsOfMeasure();
          break;
        case "warehouses":
          await loadWarehouses();
          break;
        case "stock-entries":
          await loadStockEntries();
          break;
        case "stock-balance":
          await loadBins();
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryStats = async () => {
    const result = await InventoryService.getInventoryStats(companyId);
    if (result.success && result.data) {
      setInventoryStats(result.data);
    }
  };

  const loadItems = async () => {
    const result = await InventoryService.getItems(companyId);
    if (result.success && result.data) {
      setItems(result.data);
    }
  };

  const loadItemGroups = async () => {
    const result = await InventoryService.getItemGroups(companyId);
    if (result.success && result.data) {
      setItemGroups(result.data);
    }
  };

  const loadUnitsOfMeasure = async () => {
    const result = await InventoryService.getUnitsOfMeasure(companyId);
    if (result.success && result.data) {
      setUnitsOfMeasure(result.data);
    }
  };

  const loadWarehouses = async () => {
    const result = await InventoryService.getWarehouses(companyId);
    if (result.success && result.data) {
      setWarehouses(result.data);
    }
  };

  const loadStockEntries = async () => {
    const result = await InventoryService.getStockEntries(companyId);
    if (result.success && result.data) {
      setStockEntries(result.data);
    }
  };

  const loadBins = async () => {
    const result = await InventoryService.getBins(companyId);
    if (result.success && result.data) {
      setBins(result.data);
    }
  };

  const handleCreate = (item: any) => {
    setShowDialog(false);
    setEditingItem(null);
    loadData();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const handleDelete = async (id: string, type: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      // Implement delete logic based on type
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: { variant: "default" as const, color: "bg-green-100 text-green-800" },
      Inactive: { variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
      Draft: { variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
      Submitted: { variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      Cancelled: { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      "Low Stock": { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      "In Stock": { variant: "default" as const, color: "bg-green-100 text-green-800" },
      "Out of Stock": { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Active;
    return (
      <Badge variant={config.variant} className={config.color}>
        {status}
      </Badge>
    );
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case "Stock":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "Non-Stock":
        return <Box className="h-4 w-4 text-gray-500" />;
      case "Service":
        return <Settings className="h-4 w-4 text-green-500" />;
      case "Fixed Asset":
        return <Building2 className="h-4 w-4 text-purple-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStockEntryTypeIcon = (type: string) => {
    switch (type) {
      case "Material Receipt":
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case "Material Issue":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "Material Transfer":
        return <Truck className="h-4 w-4 text-blue-500" />;
      case "Manufacture":
        return <Settings className="h-4 w-4 text-purple-500" />;
      case "Stock Reconciliation":
        return <Calculator className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Inventory Overview</h3>
        <Button onClick={loadInventoryStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold">{inventoryStats?.total_items || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Warehouse className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Warehouses</p>
                <p className="text-2xl font-bold">{inventoryStats?.total_warehouses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Stock Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(inventoryStats?.total_stock_value || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Low Stock Items</p>
                <p className="text-2xl font-bold">{inventoryStats?.low_stock_items || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Today's Movements</p>
                <p className="text-2xl font-bold">{inventoryStats?.stock_movements_today || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium">Add New Item</h3>
            <p className="text-sm text-muted-foreground">Create a new inventory item</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Warehouse className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium">Add Warehouse</h3>
            <p className="text-sm text-muted-foreground">Set up a new warehouse</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <ArrowDownRight className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-medium">Stock Receipt</h3>
            <p className="text-sm text-muted-foreground">Receive stock into warehouse</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Calculator className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <h3 className="font-medium">Stock Reconciliation</h3>
            <p className="text-sm text-muted-foreground">Reconcile physical stock</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderItems = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Items</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search items..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="type">Item Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Stock">Stock</SelectItem>
                  <SelectItem value="Non-Stock">Non-Stock</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Fixed Asset">Fixed Asset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="group">Item Group</Label>
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {itemGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.group_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="w-full"
              >
                <Target className="h-4 w-4 mr-2" />
                {sortOrder === "asc" ? "A-Z" : "Z-A"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading items...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">Create your first inventory item</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead>Standard Rate</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">{getItemTypeIcon(item.item_type)}</div>
                      <div>
                        <div className="font-medium">{item.item_name}</div>
                        <div className="text-sm text-muted-foreground">{item.item_code}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.item_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {itemGroups.find(g => g.id === item.item_group_id)?.group_name || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {unitsOfMeasure.find(u => u.id === item.stock_uom_id)?.unit_symbol || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-right font-medium">
                      {formatCurrency(item.standard_rate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {item.is_stock_item ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm">
                        {item.is_stock_item ? "Stock Item" : "Non-Stock"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.is_active ? "Active" : "Inactive")}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id, "item")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  const renderWarehouses = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Warehouses</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading warehouses...</div>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="text-center py-8">
          <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No warehouses found</h3>
          <p className="text-muted-foreground mb-4">Create your first warehouse</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(warehouse => (
            <Card key={warehouse.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Warehouse className="h-5 w-5" />
                    <span>{warehouse.warehouse_name}</span>
                  </CardTitle>
                  {getStatusBadge(warehouse.is_active ? "Active" : "Inactive")}
                </div>
                <CardDescription>{warehouse.warehouse_code}</CardDescription>
                <Badge variant="outline" className="w-fit">
                  {warehouse.warehouse_type}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {warehouse.address_line1 && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{warehouse.address_line1}</span>
                    </div>
                  )}
                  {warehouse.city && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {warehouse.city}, {warehouse.state}
                      </span>
                    </div>
                  )}
                  {warehouse.phone && (
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{warehouse.phone}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(warehouse)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(warehouse.id, "warehouse")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderStockEntries = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Stock Entries</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Stock Entry
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading stock entries...</div>
        </div>
      ) : stockEntries.length === 0 ? (
        <div className="text-center py-8">
          <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No stock entries found</h3>
          <p className="text-muted-foreground mb-4">Create your first stock entry</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Stock Entry
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">{getStockEntryTypeIcon(entry.entry_type)}</div>
                      <div>
                        <div className="font-medium">{entry.entry_no}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.created_at), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.entry_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(entry.posting_date), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(entry.total_incoming_value)}
                      </div>
                      {entry.value_difference !== 0 && (
                        <div className="text-xs text-muted-foreground">
                          Diff: {formatCurrency(entry.value_difference)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(
                      entry.docstatus === 0
                        ? "Draft"
                        : entry.docstatus === 1
                          ? "Submitted"
                          : "Cancelled",
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(entry)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {entry.docstatus === 0 && (
                        <Button variant="outline" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  const renderStockBalance = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Stock Balance</h3>
        <Button onClick={loadBins}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading stock balance...</div>
        </div>
      ) : bins.length === 0 ? (
        <div className="text-center py-8">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No stock balance found</h3>
          <p className="text-muted-foreground">
            Stock balance will appear after stock transactions
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Actual Qty</TableHead>
                <TableHead>Reserved Qty</TableHead>
                <TableHead>Available Qty</TableHead>
                <TableHead>Stock Value</TableHead>
                <TableHead>Valuation Rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bins.map(bin => {
                const item = items.find(i => i.id === bin.item_id);
                const warehouse = warehouses.find(w => w.id === bin.warehouse_id);
                const availableQty = bin.actual_qty - bin.reserved_qty;
                const isLowStock = item && bin.actual_qty <= item.reorder_level;

                return (
                  <TableRow key={bin.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {item && getItemTypeIcon(item.item_type)}
                        </div>
                        <div>
                          <div className="font-medium">{item?.item_name || "Unknown Item"}</div>
                          <div className="text-sm text-muted-foreground">{item?.item_code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {warehouse?.warehouse_name || "Unknown Warehouse"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right font-medium">{bin.actual_qty.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">{bin.reserved_qty.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right font-medium">{availableQty.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right font-medium">
                        {formatCurrency(bin.stock_value)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right">{formatCurrency(bin.valuation_rate)}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(
                        bin.actual_qty === 0
                          ? "Out of Stock"
                          : isLowStock
                            ? "Low Stock"
                            : "In Stock",
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <Package className="h-8 w-8 text-primary" />
            <span>Inventory Management</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete inventory management with cost tracking and valuation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="stock-entries">Stock Entries</TabsTrigger>
          <TabsTrigger value="stock-balance">Stock Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          {renderItems()}
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          {renderWarehouses()}
        </TabsContent>

        <TabsContent value="stock-entries" className="space-y-4">
          {renderStockEntries()}
        </TabsContent>

        <TabsContent value="stock-balance" className="space-y-4">
          {renderStockBalance()}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update item information" : "Enter item details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Form Component</h3>
              <p className="text-muted-foreground">
                The form component for {activeTab} will be implemented here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
