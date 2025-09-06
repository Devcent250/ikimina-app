import endOfMonth from "date-fns/endOfMonth";
import format from "date-fns/format";
import startOfMonth from "date-fns/startOfMonth";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ExpensesReport() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date(2023, 0, 1)),
    to: endOfMonth(new Date()),
  });

  return (
    <ExpensesProvider>
      <div className="px-3">
        <div className="container mx-auto py-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <h1 className="text-lg font-semibold tracking-tight">
                Expenses Report
              </h1>
              <p className="text-muted-foreground text-sm">
                Overview of your spending by category and time period.
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  // @ts-ignore
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <ExpensesOverview />
        </div>
      </div>
    </ExpensesProvider>
  );
}

("use client");

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { CalendarIcon, DollarSign, TrendingUp } from "lucide-react";

import type React from "react";

import { createContext, useContext, useState } from "react";
import { Button } from "@/components/ui/button";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  notes: string;
}

type ExpensesContextType = {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (id: string, expense: Expense) => void;
};

const ExpensesContext = createContext<ExpensesContextType | undefined>(
  undefined
);

function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    // Initialize with sample data for demonstration
    const sampleData: Expense[] = [
      {
        id: "1",
        description: "Grocery shopping",
        amount: 85.75,
        date: "2023-03-15T00:00:00.000Z",
        category: "Food & Dining",
        notes: "Weekly groceries from Whole Foods",
      },
      {
        id: "2",
        description: "Gas",
        amount: 45.3,
        date: "2023-03-12T00:00:00.000Z",
        category: "Transportation",
        notes: "",
      },
      {
        id: "3",
        description: "Movie tickets",
        amount: 24.99,
        date: "2023-03-10T00:00:00.000Z",
        category: "Entertainment",
        notes: "Date night",
      },
      {
        id: "4",
        description: "Electricity bill",
        amount: 112.5,
        date: "2023-03-05T00:00:00.000Z",
        category: "Utilities",
        notes: "March bill",
      },
      {
        id: "5",
        description: "Dinner at restaurant",
        amount: 78.25,
        date: "2023-03-02T00:00:00.000Z",
        category: "Food & Dining",
        notes: "Anniversary dinner",
      },
      {
        id: "6",
        description: "New headphones",
        amount: 149.99,
        date: "2023-02-28T00:00:00.000Z",
        category: "Shopping",
        notes: "Noise cancelling for work",
      },
      {
        id: "7",
        description: "Doctor visit",
        amount: 35.0,
        date: "2023-02-25T00:00:00.000Z",
        category: "Healthcare",
        notes: "Co-pay for annual checkup",
      },
      {
        id: "8",
        description: "Internet bill",
        amount: 65.0,
        date: "2023-02-20T00:00:00.000Z",
        category: "Utilities",
        notes: "",
      },
    ];

    // In a real app, we would load from localStorage or an API
    return sampleData;
  });

  const addExpense = (expense: Expense) => {
    setExpenses((prev) => [...prev, expense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const updateExpense = (id: string, updatedExpense: Expense) => {
    setExpenses((prev) =>
      prev.map((expense) => (expense.id === id ? updatedExpense : expense))
    );
  };

  return (
    <ExpensesContext.Provider
      value={{ expenses, addExpense, deleteExpense, updateExpense }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);

  if (context === undefined) {
    throw new Error("useExpenses must be used within an ExpensesProvider");
  }

  return context;
}

export function ExpensesOverview() {
  const { expenses } = useExpenses();

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const expensesByCategory = useMemo(() => {
    const categories: Record<string, number> = {};

    expenses.forEach((expense) => {
      if (categories[expense.category]) {
        categories[expense.category] += expense.amount;
      } else {
        categories[expense.category] = expense.amount;
      }
    });

    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / totalExpenses) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, totalExpenses]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FF6B6B",
    "#6A7FDB",
    "#61DAFB",
    "#F06292",
  ];

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-2 flex flex-col gap-3">
          <Card className="rounded-md shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl py-2 font-bold">
                {totalExpenses.toFixed(2)} FRW
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {expenses.length} expense entries
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-md shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Per Category
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl  py-3 font-bold">
                {(totalExpenses / (expensesByCategory.length || 1)).toFixed(2)}{" "}
                FRW
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {expensesByCategory.length} categories
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-md shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expenses Count
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl  py-3 font-bold">18</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all groups
              </p>
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-md shadow-none col-span-4">
          <CardHeader>
            <CardTitle className="mb-2">Expenses by Category</CardTitle>
            <CardDescription>
              Detailed breakdown of your spending by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesByCategory.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4 shadow-none rounded-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Category Breakdown</h3>
            <p className="text-sm text-muted-foreground">
              Detailed breakdown of your spending by category
            </p>
          </div>
          <div className="space-y-4">
            {expensesByCategory.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-sm">{category.name}</span>
                  </div>
                  <span className="font-medium">
                    {category.value.toFixed(2)} FRW
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${category.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {category.percentage.toFixed(1)}% of total expenses
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
