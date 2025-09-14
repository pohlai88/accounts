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
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  CheckSquare,
  XCircle,
  User,
  Globe,
  Database,
  FileCheck,
  Scale,
  Gavel,
  BookOpen,
  ClipboardCheck,
  UserCheck,
  ShieldCheck,
  Key,
  Fingerprint,
  Monitor,
  Smartphone,
  MapPin,
  Clock3,
  Calendar as CalendarIcon,
  Flag,
  Bell,
  Archive,
  Trash,
  History,
  Search as SearchIcon,
  Filter as FilterIcon,
  Star,
  Crown,
  Award,
  Gem,
  ShoppingCart,
  CreditCard,
  Percent,
  Tag,
  Gift,
  Sparkles,
  Zap as ZapIcon,
  TrendingDown,
  Languages,
  Map,
  Compass,
  Navigation,
} from "lucide-react";
import {
  LocalizationService,
  Country,
  LocalizationPack,
  CompanyLocalizationSettings,
} from "@/lib/localization-service";
import { format } from "date-fns";

export default function LocalizationMarketplacePage() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showPackDetails, setShowPackDetails] = useState(false);
  const [selectedPack, setSelectedPack] = useState<any>(null);

  // Data states
  const [countries, setCountries] = useState<Country[]>([]);
  const [localizationPacks, setLocalizationPacks] = useState<LocalizationPack[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanyLocalizationSettings[]>([]);
  const [localizationStats, setLocalizationStats] = useState<any>(null);
  const [packPricing, setPackPricing] = useState<any[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterPackType, setFilterPackType] = useState<string>("all");
  const [filterPriceRange, setFilterPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("country_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const companyId = "default-company";

  useEffect(() => {
    loadData();
  }, [companyId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "marketplace":
          await loadLocalizationPacks();
          await loadPackPricing();
          break;
        case "countries":
          await loadCountries();
          break;
        case "my-packs":
          await loadCompanySettings();
          break;
        case "analytics":
          await loadLocalizationStats();
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCountries = async () => {
    const result = await LocalizationService.getCountries();
    if (result.success && result.data) {
      setCountries(result.data);
    }
  };

  const loadLocalizationPacks = async () => {
    const result = await LocalizationService.getLocalizationPacks(undefined, undefined, true);
    if (result.success && result.data) {
      setLocalizationPacks(result.data);
    }
  };

  const loadCompanySettings = async () => {
    const result = await LocalizationService.getCompanyLocalizationSettings(companyId);
    if (result.success && result.data) {
      setCompanySettings(result.data);
    }
  };

  const loadLocalizationStats = async () => {
    const result = await LocalizationService.getLocalizationStatistics();
    if (result.success && result.data) {
      setLocalizationStats(result.data);
    }
  };

  const loadPackPricing = async () => {
    const result = await LocalizationService.getPackPricing();
    if (result.success && result.data) {
      setPackPricing(result.data);
    }
  };

  const handleActivatePack = async (packId: string, licenseType: string = "Standard") => {
    const result = await LocalizationService.activateLocalizationPack(
      companyId,
      packId,
      licenseType as any,
    );
    if (result.success) {
      await loadCompanySettings();
    }
  };

  const handleViewPackDetails = async (pack: LocalizationPack) => {
    const result = await LocalizationService.getLocalizationPackDetails(pack.id);
    if (result.success && result.data) {
      setSelectedPack({ ...pack, details: result.data });
      setShowPackDetails(true);
    }
  };

  const getPackTypeIcon = (packType: string) => {
    switch (packType) {
      case "Standard":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "Premium":
        return <Crown className="h-4 w-4 text-purple-500" />;
      case "Enterprise":
        return <Award className="h-4 w-4 text-gold-500" />;
      case "Custom":
        return <Gem className="h-4 w-4 text-pink-500" />;
      default:
        return <Flag className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: {
        variant: "default" as const,
        className: "bg-primary/10 text-primary border-primary/20",
      },
      Inactive: { variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
      Suspended: {
        variant: "destructive" as const,
        className: "bg-destructive/10 text-destructive border-destructive/20",
      },
      Expired: {
        variant: "destructive" as const,
        className: "bg-destructive/10 text-destructive border-destructive/20",
      },
      Trial: {
        variant: "default" as const,
        className: "bg-primary/10 text-primary border-primary/20",
      },
      Standard: {
        variant: "default" as const,
        className: "bg-primary/10 text-primary border-primary/20",
      },
      Premium: {
        variant: "default" as const,
        className: "bg-primary/10 text-primary border-primary/20",
      },
      Enterprise: {
        variant: "default" as const,
        className: "bg-primary/10 text-primary border-primary/20",
      },
      Published: {
        variant: "default" as const,
        className: "bg-primary/10 text-primary border-primary/20",
      },
      Certified: {
        variant: "default" as const,
        className: "bg-primary/10 text-primary border-primary/20",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Active;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const renderMarketplace = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Localization Marketplace</h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadLocalizationPacks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Packs</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by country or pack name..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="region">Region</Label>
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="North America">North America</SelectItem>
                  <SelectItem value="Europe">Europe</SelectItem>
                  <SelectItem value="Asia">Asia</SelectItem>
                  <SelectItem value="Oceania">Oceania</SelectItem>
                  <SelectItem value="South America">South America</SelectItem>
                  <SelectItem value="Africa">Africa</SelectItem>
                  <SelectItem value="Middle East">Middle East</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="packType">Pack Type</Label>
              <Select value={filterPackType} onValueChange={setFilterPackType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price">Price Range</Label>
              <Select value={filterPriceRange} onValueChange={setFilterPriceRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="0-50">$0 - $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100+">$100+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Packs */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Localization Packs</CardTitle>
          <CardDescription>Popular country-specific accounting and tax solutions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading packs...</div>
            </div>
          ) : packPricing.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No localization packs available</h3>
              <p className="text-muted-foreground">Check back later for new localization packs</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packPricing.slice(0, 9).map(pack => (
                <Card
                  key={pack.pack_id}
                  className="relative overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {pack.pack_type === "Premium" && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-pink-500 text-white px-3 py-1 text-xs font-medium">
                      PREMIUM
                    </div>
                  )}
                  {pack.pack_type === "Enterprise" && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-gold-500 to-yellow-500 text-white px-3 py-1 text-xs font-medium">
                      ENTERPRISE
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Flag className="h-5 w-5" />
                        <span>{pack.country_name}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-1">
                        {getPackTypeIcon(pack.pack_type)}
                        {getStatusBadge(pack.pack_type)}
                      </div>
                    </div>
                    <CardDescription>{pack.pack_name}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Pricing */}
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl font-bold">
                          {formatCurrency(pack.monthly_price)}
                        </span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        or {formatCurrency(pack.annual_price)}/year
                      </div>
                      {pack.savings_percentage > 0 && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          Save {pack.savings_percentage}% annually
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Included Features:</h4>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {pack.features.map((feature: string, index: number) => (
                          <div key={index} className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewPackDetails(pack)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleActivatePack(pack.pack_id)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCountries = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Supported Countries</h3>
        <Button onClick={loadCountries}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Countries Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading countries...</div>
        </div>
      ) : countries.length === 0 ? (
        <div className="text-center py-8">
          <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No countries found</h3>
          <p className="text-muted-foreground">Countries will be loaded automatically</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {countries.map(country => (
            <Card key={country.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Flag className="h-5 w-5" />
                    <span>{country.country_name}</span>
                  </CardTitle>
                  {getStatusBadge(country.is_supported ? "Supported" : "Coming Soon")}
                </div>
                <CardDescription>{country.region}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span className="font-medium">
                    {country.currency_symbol} {country.currency_code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fiscal Year:</span>
                  <span>Month {country.fiscal_year_start_month}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timezone:</span>
                  <span>{country.timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Language:</span>
                  <span>{country.primary_language}</span>
                </div>
                {country.is_supported && (
                  <Button size="sm" className="w-full mt-3">
                    <Eye className="h-4 w-4 mr-2" />
                    View Packs
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderMyPacks = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">My Localization Packs</h3>
        <Button onClick={() => setActiveTab("marketplace")}>
          <Plus className="h-4 w-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>

      {/* Active Packs */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading your packs...</div>
        </div>
      ) : companySettings.length === 0 ? (
        <div className="text-center py-8">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No localization packs activated</h3>
          <p className="text-muted-foreground mb-4">
            Browse the marketplace to find packs for your region
          </p>
          <Button onClick={() => setActiveTab("marketplace")}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Browse Marketplace
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companySettings.map((setting: any) => (
            <Card key={setting.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Flag className="h-5 w-5" />
                    <span>{setting.localization_packs?.countries?.country_name}</span>
                  </CardTitle>
                  {getStatusBadge(setting.activation_status)}
                </div>
                <CardDescription>{setting.localization_packs?.pack_name}</CardDescription>
                <Badge variant="outline" className="w-fit">
                  {setting.license_type}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Activated:</span>
                  <span>{format(new Date(setting.activated_at), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span>License Start:</span>
                  <span>{format(new Date(setting.license_start_date), "MMM dd, yyyy")}</span>
                </div>
                {setting.license_end_date && (
                  <div className="flex justify-between">
                    <span>License End:</span>
                    <span>{format(new Date(setting.license_end_date), "MMM dd, yyyy")}</span>
                  </div>
                )}
                {setting.max_transactions && (
                  <div className="flex justify-between">
                    <span>Transactions Used:</span>
                    <span>
                      {setting.transactions_used} / {setting.max_transactions}
                    </span>
                  </div>
                )}
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Localization Analytics</h3>
        <Button onClick={loadLocalizationStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Countries</p>
                <p className="text-2xl font-bold">{localizationStats?.total_countries || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flag className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Available Packs</p>
                <p className="text-2xl font-bold">{localizationStats?.published_packs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Certified Packs</p>
                <p className="text-2xl font-bold">{localizationStats?.certified_packs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Active Companies</p>
                <p className="text-2xl font-bold">{localizationStats?.active_companies || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Packs */}
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Packs</CardTitle>
          <CardDescription>Top-performing localization packs by activation count</CardDescription>
        </CardHeader>
        <CardContent>
          {localizationStats?.popular_packs?.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No usage data available yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {localizationStats?.popular_packs?.map((pack: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                    <div>
                      <div className="font-medium">{pack.pack_name}</div>
                      <div className="text-sm text-muted-foreground">{pack.country_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{pack.activation_count} activations</div>
                    <div className="text-xs text-muted-foreground">
                      {(
                        (pack.activation_count / (localizationStats?.active_companies || 1)) *
                        100
                      ).toFixed(1)}
                      % of companies
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <Globe className="h-8 w-8 text-primary" />
            <span>Global Localization</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Country-specific accounting packs for global business compliance
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Business Value Banner */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">🌍 Global Business Ready</h2>
              <p className="text-blue-100 mb-4">
                Expand your business globally with country-specific accounting rules, tax systems,
                and compliance frameworks. Our localization packs ensure you're compliant and
                competitive in any market.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>25+ Countries Supported</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>Regulatory Compliant</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>Instant Activation</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">25+</div>
              <div className="text-blue-100">Countries</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="my-packs">My Packs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          {renderMarketplace()}
        </TabsContent>

        <TabsContent value="countries" className="space-y-4">
          {renderCountries()}
        </TabsContent>

        <TabsContent value="my-packs" className="space-y-4">
          {renderMyPacks()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>

      {/* Pack Details Dialog */}
      <Dialog open={showPackDetails} onOpenChange={setShowPackDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPack?.country_name} - {selectedPack?.pack_name}
            </DialogTitle>
            <DialogDescription>
              Comprehensive localization pack details and features
            </DialogDescription>
          </DialogHeader>

          {selectedPack && (
            <div className="space-y-6">
              {/* Pack Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pack Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Pack Type:</span>
                      <span>{getStatusBadge(selectedPack.pack_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span className="font-medium">{selectedPack.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Support Level:</span>
                      <span className="font-medium">{selectedPack.support_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Update Frequency:</span>
                      <span className="font-medium">{selectedPack.update_frequency}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Monthly:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedPack.monthly_price)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedPack.annual_price)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Setup Fee:</span>
                      <span className="font-medium">{formatCurrency(selectedPack.setup_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Savings:</span>
                      <span className="font-medium text-green-600">
                        {selectedPack.savings_percentage}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Features Included */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Features Included</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedPack.features?.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  className="flex-1"
                  onClick={() => handleActivatePack(selectedPack.pack_id, "Standard")}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Activate Standard
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleActivatePack(selectedPack.pack_id, "Premium")}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Activate Premium
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleActivatePack(selectedPack.pack_id, "Trial")}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Start Trial
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
