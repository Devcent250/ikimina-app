import {
  CreditCard,
  DollarSign,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building,
  Clock,
  ExternalLinkIcon,
  ArrowRight,
  Loader2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DashboardOverview() {
  const [selectedBranch, setSelectedBranch] = useState("all");

  const { data: analytics, status } = useQuery("dashboardData", async () => {
    const { data } = await api.get("/analytics/dashboard-data");
    return data?.data;
  });

  const { data: recentContributions, status: contributionsStatus } = useQuery(
    "recent-contributions",
    async () => {
      const { data } = await api.get("/contributions?limit=5");
      return data?.results;
    }
  );

  const { data: currentMonthContributions } = useQuery(
    "current-month-contributions",
    async () => {
      const { data } = await api.get("/analytics/current-month-contributions");
      return data?.data?.total;
    }
  );

  const { data: savingsByGroups = [] } = useQuery(
    "savings-by-group",
    async () => {
      const { data } = await api.get("/analytics/savings-by-group");
      return data?.data;
    }
  );

  const filteredGroups =
    selectedBranch === "all"
      ? savingsByGroups
      : savingsByGroups.filter((group) => group.branchId === selectedBranch);

  const { data: branches } = useQuery("branches", async () => {
    const { data } = await api.get("/branches");
    return data?.results;
  });

  const { data: activeLoans = [] } = useQuery("active-loans", async () => {
    const { data } = await api.get("/loans?limit=5");
    return data?.results;
  });

  ///loans-distributions-per-group
  const { data: loansDistributionsPerGroup = [] } = useQuery(
    "loans-distributions-per-group",
    async () => {
      const { data } = await api.get(
        "/analytics/loans-distributions-per-group"
      );
      return data?.data;
    }
  );

  return (
    <div className="flex-1 sm:px-3 py-4">
      <div className="flex sm:items-center justify-between mb-4 flex-col sm:flex-row">
        <div>
          <h1 className="text-lg mb-1 font-semibold tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 leading-6 text-sm">
            Welcome back! Here's an overview of your savings groups.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button size="sm" className="mt-4 sm:mt-0">
            <ExternalLinkIcon className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger className="px-6" value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger disabled className="px-6" value="analytics">
            Reports & Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            <Card className="shadow-none rounded-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Savings Across All Groups
                </CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl py-2 font-bold">
                  {status === "loading" ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    analytics?.totalSavings?.toLocaleString() + " FRW"
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">
                    +12.5%
                  </span>{" "}
                  <span className="ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Active Members
                </CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl py-2 font-bold">
                  {status === "loading" ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    analytics?.activeMembers
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">+5.2%</span>
                  <span className="ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Active Loans
                </CardTitle>
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl py-2 font-bold">
                  {status === "loading" ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    analytics?.activeLoans
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowDownRight className="w-3 h-3 mr-1 text-red-500" />
                  <span className="text-red-500 font-medium">-2.3%</span>
                  <span className="ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Total Groups
                </CardTitle>
                <Wallet className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl py-2 font-bold">
                  {status === "loading" ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    analytics?.totalGroups
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span>Total groups across.</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Branches Count
                </CardTitle>
                <Building className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl py-2 font-bold">
                  {status === "loading" ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    analytics?.branchesCount
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  Total branches across.
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Current Season Savings
                </CardTitle>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl py-2 font-bold">
                  {status === "loading" ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    analytics?.currentSeasonSavings?.toLocaleString() + " FRW"
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Season 3</span> - 45% complete
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Loans Balance
                </CardTitle>
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl py-2 font-bold">
                  {status === "loading" ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    analytics?.loansBalance?.toLocaleString() + " FRW"
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowDownRight className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">-5.7%</span>
                  <span className="ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  Repayment Rate
                </CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl py-2 font-bold">
                  {status === "loading" ? (
                    <Skeleton className="h-8 w-[100px]" />
                  ) : (
                    analytics?.repaymentRate + "%"
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">+2.1%</span>
                  <span className="ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Contributions */}
          <Card className="shadow-none rounded-md">
            <CardHeader className="flex border-b flex-col sm:flex-row sm:items-center justify-between">
              <div className="space-y-2">
                <CardTitle>Recent Contributions</CardTitle>
                <CardDescription>
                  Latest member contributions across all groups
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="!mt-4 sm:mt-0">
                View All Contributions
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="truncate">Payment Method</TableHead>
                    <TableHead className="truncate">Recieved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentContributions?.map((contribution) => {
                    return (
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {contribution.member?.fullNames[0]}
                                {contribution.member?.fullNames[1]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="truncate">
                              {contribution.member?.fullNames}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="truncate">
                          {contribution.group?.name}
                        </TableCell>
                        <TableCell className="truncate">
                          {contribution?.depositAmount?.toLocaleString()} FRW
                        </TableCell>
                        <TableCell className="truncate">
                          {format(contribution.createdAt, "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="truncate">
                          {contribution.paymentMethod?.name}
                        </TableCell>
                        <TableCell className="truncate">
                          {contribution.receivedBy?.name}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {recentContributions?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        No contributions found
                      </TableCell>
                    </TableRow>
                  )}
                  {contributionsStatus === "loading" && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        <div className="flex justify-center items-center h-[150px]">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t pt-3">
              <div className="text-sm text-muted-foreground">
                Total contributions this month:{" "}
                {currentMonthContributions?.toLocaleString()} FRW
              </div>
            </CardFooter>
          </Card>

          {/* Current Savings by Group */}
          <Card className="shadow-none rounded-md">
            <CardHeader className="border-b space-y-2">
              <CardTitle>Current Savings by Group</CardTitle>
              <CardDescription>
                Total savings accumulated by each group
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 pb-5">
              <Tabs
                defaultValue="all"
                className="mb-4"
                onValueChange={setSelectedBranch}
              >
                <ScrollArea className="w-full rounded-lg border-r border-l whitespace-nowrap">
                  <TabsList>
                    <TabsTrigger value="all">All Branches</TabsTrigger>
                    {branches?.map((e) => (
                      <TabsTrigger value={e.id}>{e.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </Tabs>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredGroups.map((group) => (
                    <Card key={group.name} className="shadow-none rounded-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {group.groupName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold">
                          {Number(group?.totalSavings).toLocaleString()} FRW
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-sm text-muted-foreground">
                            Total percentage of total savings
                          </div>
                          <div className="flex items-center text-xs">
                            <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                            <span className="text-green-500 font-medium">
                              +{group.growth}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 text-sm">
                          <div className="flex justify-between">
                            <span>Members: {group.totalMembers}</span>
                            <span>
                              Avg:
                              {Number(
                                group.averageSavings
                              ).toLocaleString()}{" "}
                              FRW
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!filteredGroups.length && (
                    <div className="col-span-3 border rounded-md text-sm text-slate-500 text-center py-16">
                      No groups found
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-0 md:gap-3 md:grid-cols-6">
            {/* Active Loan Balances */}
            <Card className="shadow-none rounded-md col-span-4">
              <CardHeader className="flex border-b flex-col sm:flex-row sm:items-center justify-between">
                <div className="space-y-2">
                  <CardTitle>Active Loan Balances</CardTitle>
                  <CardDescription>
                    Overview of current outstanding loans
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="!mt-4 sm:mt-0">
                  View All Loans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Loan Amount</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Loan Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLoans.map((e) => {
                      return (
                        <TableRow>
                          <TableCell className="font-medium py-3 truncate">
                            {e?.member?.fullNames}
                          </TableCell>
                          <TableCell className="truncate">
                            {e?.group?.name}
                          </TableCell>
                          <TableCell className="truncate">
                            {e?.amount?.toLocaleString()} FRW
                          </TableCell>
                          <TableCell className="truncate">
                            {e?.dueAmount?.toLocaleString()} FRW
                          </TableCell>
                          <TableCell className="truncate">
                            {e.interestRate}%
                          </TableCell>
                          <TableCell className="truncate">
                            {e?.loanType}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Loan Distribution by Group */}
            <Card className="shadow-none md:mt-0 mt-4 rounded-md col-span-2">
              <CardHeader className="border-b space-y-2 ">
                <CardTitle>Loan Distribution by Group</CardTitle>
                <CardDescription>
                  Overview of loans across different savings groups
                </CardDescription>
              </CardHeader>
              <CardContent className="py-3">
                <div className="space-y-8">
                  {loansDistributionsPerGroup.map((e) => {
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <div className="text-sm font-medium">
                              {e?.groupName}{" "}
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {Number(e?.totalLoans)?.toLocaleString()} FRW (
                            {e.percentage}%)
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${e.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full mt-5 flex justify-between text-sm text-muted-foreground">
                  <span>3 of 12 groups have active loans</span>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Contribution Analytics */}
          <Card className="shadow-none rounded-md">
            <CardHeader>
              <CardTitle>Contribution Analytics</CardTitle>
              <CardDescription>
                Detailed analysis of contributions over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="h-[400px]">
                <ContributionCharts />
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-none rounded-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Contribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$125.75</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                      <span className="text-green-500 font-medium">
                        +5.2%
                      </span>{" "}
                      from last month
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none rounded-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Monthly Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12.5%</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                      <span className="text-green-500 font-medium">
                        +2.3%
                      </span>{" "}
                      from last month
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none rounded-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Contribution Frequency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2.3</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Average contributions per member per month
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none rounded-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Contribution Variance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">±$45.20</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Standard deviation across all contributions
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { useQuery } from "react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const monthlyData = [
  { name: "Jan", contributions: 3200, members: 210 },
  { name: "Feb", contributions: 3500, members: 220 },
  { name: "Mar", contributions: 4200, members: 230 },
  { name: "Apr", contributions: 4000, members: 235 },
  { name: "May", contributions: 4500, members: 240 },
  { name: "Jun", contributions: 4800, members: 245 },
  { name: "Jul", contributions: 5200, members: 245 },
  { name: "Aug", contributions: 5500, members: 250 },
  { name: "Sep", contributions: 5800, members: 255 },
  { name: "Oct", contributions: 6000, members: 260 },
  { name: "Nov", contributions: 6200, members: 265 },
  { name: "Dec", contributions: 6500, members: 270 },
];

const groupContributions = [
  { name: "Village Traders", value: 8750 },
  { name: "Women's Empowerment", value: 7235 },
  { name: "Youth Development", value: 5200 },
  { name: "Community Builders", value: 2500 },
  { name: "Rural Entrepreneurs", value: 1000 },
];

const weeklyContributions = [
  { day: "Mon", amount: 850 },
  { day: "Tue", amount: 1200 },
  { day: "Wed", amount: 950 },
  { day: "Thu", amount: 500 },
  { day: "Fri", amount: 750 },
  { day: "Sat", amount: 1500 },
  { day: "Sun", amount: 100 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function ContributionCharts() {
  return (
    <Tabs defaultValue="monthly">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Pattern</TabsTrigger>
          <TabsTrigger value="groups">Group Distribution</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="monthly" className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={monthlyData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="contributions"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              name="Contributions ($)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="members"
              stroke="#82ca9d"
              name="Active Members"
            />
          </LineChart>
        </ResponsiveContainer>
      </TabsContent>

      <TabsContent value="weekly" className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weeklyContributions}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="amount"
              name="Contribution Amount ($)"
              fill="#8884d8"
            />
          </BarChart>
        </ResponsiveContainer>
      </TabsContent>

      <TabsContent value="groups" className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={groupContributions}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {groupContributions.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`$${value}`, "Contribution"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </TabsContent>
    </Tabs>
  );
}
