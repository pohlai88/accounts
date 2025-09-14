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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  DollarSign,
  TrendingDown,
  Wrench,
  ArrowRightLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  MapPin,
  User,
  Settings,
} from "lucide-react";
import {
  FixedAssetsService,
  type FixedAsset,
  type AssetCategory,
  type AssetLocation,
  type DepreciationMethod,
  type AssetStatus,
} from "@/lib/fixed-assets-service";
import { format } from "date-fns";

interface FixedAssetsManagementProps {
  companyId: string;
}

export function FixedAssetsManagement({ companyId }: FixedAssetsManagementProps) {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState({
    category_id: "",
    location_id: "",
    status: "",
    search: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [assetsResult, categoriesResult, locationsResult] = await Promise.all([
        FixedAssetsService.getAssets(companyId, filters),
        FixedAssetsService.getAssetCategories(companyId),
        FixedAssetsService.getAssetLocations(companyId),
      ]);

      if (assetsResult.success) {
        setAssets(assetsResult.assets || []);
      } else {
        setError(assetsResult.error || "Failed to load assets");
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.categories || []);
      }

      if (locationsResult.success) {
        setLocations(locationsResult.locations || []);
      }
    } catch (err) {
      setError("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId, filters]);

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Disposed":
        return "bg-red-100 text-red-800";
      case "Transferred":
        return "bg-blue-100 text-blue-800";
      case "Under Maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "Retired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDepreciationMethodColor = (method: DepreciationMethod) => {
    switch (method) {
      case "Straight Line":
        return "bg-blue-100 text-blue-800";
      case "Declining Balance":
        return "bg-purple-100 text-purple-800";
      case "Sum of Years Digits":
        return "bg-orange-100 text-orange-800";
      case "Units of Production":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Fixed Assets Management
          </h2>
          <p className="text-muted-foreground">
            Manage your company's fixed assets, depreciation, and maintenance
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search assets..."
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.category_id}
                onValueChange={value => setFilters(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={filters.location_id}
                onValueChange={value => setFilters(prev => ({ ...prev, location_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Disposed">Disposed</SelectItem>
                  <SelectItem value="Transferred">Transferred</SelectItem>
                  <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Number</TableHead>
                <TableHead>Asset Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Purchase Cost</TableHead>
                <TableHead>Book Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map(asset => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.asset_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{asset.asset_name}</div>
                      {asset.description && (
                        <div className="text-sm text-muted-foreground">{asset.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{asset.category?.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {asset.location?.name || "No location"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      {asset.purchase_cost.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-muted-foreground" />
                      {asset.current_book_value.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Asset Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>Comprehensive information about this fixed asset</DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <ScrollArea className="max-h-96">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Asset Number</Label>
                    <p className="text-sm">{selectedAsset.asset_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Asset Name</Label>
                    <p className="text-sm">{selectedAsset.asset_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm">{selectedAsset.category?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm">{selectedAsset.location?.name || "No location"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getStatusColor(selectedAsset.status)}>
                      {selectedAsset.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Custodian</Label>
                    <p className="text-sm">{selectedAsset.custodian || "Not assigned"}</p>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h4 className="font-semibold mb-2">Financial Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Purchase Cost</Label>
                      <p className="text-sm font-mono">
                        {selectedAsset.purchase_cost.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Current Book Value</Label>
                      <p className="text-sm font-mono">
                        {selectedAsset.current_book_value.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Accumulated Depreciation</Label>
                      <p className="text-sm font-mono">
                        {selectedAsset.accumulated_depreciation.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Salvage Value</Label>
                      <p className="text-sm font-mono">
                        {selectedAsset.salvage_value.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Depreciation Method</Label>
                      <Badge
                        className={getDepreciationMethodColor(selectedAsset.depreciation_method)}
                      >
                        {selectedAsset.depreciation_method}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Useful Life</Label>
                      <p className="text-sm">{selectedAsset.useful_life_years} years</p>
                    </div>
                  </div>
                </div>

                {/* Purchase Information */}
                <div>
                  <h4 className="font-semibold mb-2">Purchase Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Purchase Date</Label>
                      <p className="text-sm">
                        {format(new Date(selectedAsset.purchase_date), "PP")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Supplier</Label>
                      <p className="text-sm">{selectedAsset.supplier || "Not specified"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Invoice Number</Label>
                      <p className="text-sm">
                        {selectedAsset.purchase_invoice_no || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Warranty Expiry</Label>
                      <p className="text-sm">
                        {selectedAsset.warranty_expiry_date
                          ? format(new Date(selectedAsset.warranty_expiry_date), "PP")
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {(selectedAsset.serial_number ||
                  selectedAsset.model ||
                  selectedAsset.manufacturer) && (
                  <div>
                    <h4 className="font-semibold mb-2">Additional Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAsset.serial_number && (
                        <div>
                          <Label className="text-sm font-medium">Serial Number</Label>
                          <p className="text-sm">{selectedAsset.serial_number}</p>
                        </div>
                      )}
                      {selectedAsset.model && (
                        <div>
                          <Label className="text-sm font-medium">Model</Label>
                          <p className="text-sm">{selectedAsset.model}</p>
                        </div>
                      )}
                      {selectedAsset.manufacturer && (
                        <div>
                          <Label className="text-sm font-medium">Manufacturer</Label>
                          <p className="text-sm">{selectedAsset.manufacturer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedAsset.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm bg-muted p-2 rounded">{selectedAsset.notes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Asset Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Create a new fixed asset with all necessary information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="asset_name">Asset Name *</Label>
                <Input id="asset_name" placeholder="Enter asset name" />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="purchase_cost">Purchase Cost *</Label>
                <Input id="purchase_cost" type="number" placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="purchase_date">Purchase Date *</Label>
                <Input id="purchase_date" type="date" />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="custodian">Custodian</Label>
                <Input id="custodian" placeholder="Enter custodian name" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button>Create Asset</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
