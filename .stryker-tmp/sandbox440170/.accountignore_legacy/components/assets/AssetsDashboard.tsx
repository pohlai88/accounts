/**
 * Assets Dashboard - Complete Fixed Assets Overview
 * ERPNext-level asset management with modern React interface
 */
// @ts-nocheck


"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  DollarSign,
  TrendingDown,
  Wrench,
  Shield,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Settings,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import {
  FixedAssetsService,
  Asset,
  AssetCategory,
  AssetLocation,
} from "@/lib/fixed-assets-service";

interface AssetAnalytics {
  total_assets: number;
  total_asset_value: number;
  total_accumulated_depreciation: number;
  net_book_value: number;
  assets_by_category: { category: string; count: number; value: number }[];
  maintenance_due_soon: number;
  insurance_expiring_soon: number;
}

export default function AssetsDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [analytics, setAnalytics] = useState<AssetAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const companyId = "current-company-id"; // Get from context/props

  useEffect(() => {
    loadDashboardData();
  }, [companyId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [assetsResult, categoriesResult, locationsResult, analyticsResult] = await Promise.all([
        FixedAssetsService.getAssets(companyId, {
          category_id: selectedCategory || undefined,
          location_id: selectedLocation || undefined,
          status: (selectedStatus as any) || undefined,
          search: searchTerm || undefined,
        }),
        FixedAssetsService.getAssetCategories(companyId),
        FixedAssetsService.getAssetLocations(companyId),
        FixedAssetsService.getAssetAnalytics(companyId),
      ]);

      if (assetsResult.success && assetsResult.data) {
        setAssets(assetsResult.data);
      }

      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (locationsResult.success && locationsResult.data) {
        setLocations(locationsResult.data);
      }

      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadDashboardData();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedLocation("");
    setSelectedStatus("");
    loadDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Submitted":
      case "Partially Depreciated":
        return "default";
      case "Fully Depreciated":
        return "secondary";
      case "Sold":
      case "Scrapped":
        return "destructive";
      case "In Maintenance":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assets dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fixed Assets</h2>
          <p className="text-muted-foreground">
            Comprehensive asset management and depreciation tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Asset
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_assets}</div>
              <p className="text-xs text-muted-foreground">Active assets in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Asset Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics.total_asset_value)}
              </div>
              <p className="text-xs text-muted-foreground">Total purchase value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Book Value</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.net_book_value)}</div>
              <p className="text-xs text-muted-foreground">After depreciation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {analytics.maintenance_due_soon}
              </div>
              <p className="text-xs text-muted-foreground">Next 30 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <label className="text-sm font-medium mb-2 block">Search Assets</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, code, or serial number..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-w-40"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-w-40"
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.location_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-w-40"
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Active</option>
                <option value="Partially Depreciated">Partially Depreciated</option>
                <option value="Fully Depreciated">Fully Depreciated</option>
                <option value="Sold">Sold</option>
                <option value="Scrapped">Scrapped</option>
                <option value="In Maintenance">In Maintenance</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch}>Search</Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets List/Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Assets ({assets.length})
            </span>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Asset
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Asset</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">Purchase Value</th>
                  <th className="text-left p-3 font-medium">Book Value</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Purchase Date</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{asset.asset_name}</div>
                        <div className="text-sm text-muted-foreground">{asset.asset_code}</div>
                        {asset.serial_no && (
                          <div className="text-xs text-muted-foreground">SN: {asset.serial_no}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        {(asset as any).category?.category_name || "N/A"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {(asset as any).location?.location_name || "N/A"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">
                        {formatCurrency(asset.gross_purchase_amount)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{formatCurrency(asset.asset_value)}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant={getStatusBadgeVariant(asset.status)}>{asset.status}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="text-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(asset.purchase_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {asset.status === "Draft" && (
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {assets.length === 0 && (
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No assets found</p>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first asset
              </p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Asset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Asset Reports</h3>
            <p className="text-sm text-muted-foreground">
              Generate detailed asset reports and analytics
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <TrendingDown className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Depreciation</h3>
            <p className="text-sm text-muted-foreground">
              Manage depreciation schedules and entries
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Maintenance</h3>
            <p className="text-sm text-muted-foreground">Track maintenance schedules and costs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
