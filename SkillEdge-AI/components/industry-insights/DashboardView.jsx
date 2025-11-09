"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BriefcaseIcon,
  LineChart,
  TrendingUp,
  TrendingDown,
  Brain,
  RotateCcw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const DashboardView = ({ insights }) => {
  // Helper function to generate personalized summary
  const generatePersonalizedSummary = (insights) => {
    const { industry, position, marketOutlook, growthRate, demandLevel, topSkills, recommendedSkills } = insights;
    
    let outlookText = "";
    switch (marketOutlook.toLowerCase()) {
      case "positive":
        outlookText = "showing strong growth potential and excellent career opportunities";
        break;
      case "neutral":
        outlookText = "maintaining stable conditions with steady opportunities";
        break;
      case "negative":
        outlookText = "facing some challenges but still offering opportunities for skilled professionals";
        break;
      default:
        outlookText = "presenting various opportunities for career advancement";
    }

    let demandText = "";
    switch (demandLevel.toLowerCase()) {
      case "high":
        demandText = "There's currently high demand for professionals in your field, making it an excellent time for career advancement and salary negotiations.";
        break;
      case "medium":
        demandText = "The job market shows moderate demand for your skills, providing good opportunities for those who stay current with industry trends.";
        break;
      case "low":
        demandText = "While demand is currently lower, focusing on in-demand skills and specializations can help you stand out in the market.";
        break;
      default:
        demandText = "The market presents various opportunities for skilled professionals.";
    }

    const hasRecommendedSkills = recommendedSkills && recommendedSkills.length > 0;
    const skillText = hasRecommendedSkills 
      ? ` To enhance your marketability, consider developing skills in ${recommendedSkills.slice(0, 3).join(", ")}${recommendedSkills.length > 3 ? ", and others" : ""}.`
      : " Your current skill set aligns well with market demands.";

    return `As a ${position} in the ${industry} industry, you're positioned in a sector that is currently ${outlookText}, with a growth rate of ${growthRate.toFixed(1)}%. ${demandText} The most valuable skills in your field include ${topSkills.slice(0, 4).join(", ")}, which are driving innovation and creating new opportunities.${skillText} With the industry trends pointing towards continued evolution, staying updated with emerging technologies and methodologies will be key to your continued success.`;
  };

  // Transform salary data for the chart
  const salaryData = insights.salaryRanges.map((range) => ({
    name: range.role,
    min: range.min / 1000,
    max: range.max / 1000,
    median: range.median / 1000,
  }));

  const getDemandLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMarketOutlookInfo = (outlook) => {
    switch (outlook.toLowerCase()) {
      case "positive":
        return { icon: TrendingUp, color: "text-green-500" };
      case "neutral":
        return { icon: LineChart, color: "text-yellow-500" };
      case "negative":
        return { icon: TrendingDown, color: "text-red-500" };
      default:
        return { icon: LineChart, color: "text-gray-500" };
    }
  };

  const OutlookIcon = getMarketOutlookInfo(insights.marketOutlook).icon;
  const outlookColor = getMarketOutlookInfo(insights.marketOutlook).color;

  // Format dates using date-fns
  const lastUpdatedDate = format(new Date(insights.lastUpdated), "dd/MM/yyyy");
  const nextUpdateDistance = formatDistanceToNow(
    new Date(insights.nextUpdate),
    { addSuffix: true }
  );

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 items-center">
        <Badge variant="">Last updated: {lastUpdatedDate}</Badge>
        <Badge
          className={`flex space-x-1 bg-black text-white hover:text-black hover:bg-gray-300`}
          variant="outline"
        >
          <RotateCcw className="h-4 w-4" />
          <Link href="/profile/update">Update Profile</Link>
        </Badge>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Market Outlook
            </CardTitle>
            <OutlookIcon className={`h-4 w-4 ${outlookColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.marketOutlook}</div>
            <p className="text-xs text-muted-foreground">
              Next update {nextUpdateDistance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Industry Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.growthRate.toFixed(1)}%
            </div>
            <Progress value={insights.growthRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Level</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.demandLevel}</div>
            <div
              className={`h-2 w-full rounded-full mt-2 ${getDemandLevelColor(
                insights.demandLevel
              )}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Skills</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {insights.topSkills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
              {insights.topSkills.length > 4 && (
                <Badge variant="outline">
                  +{insights.topSkills.length - 4} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Ranges Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Salary Ranges by Role</CardTitle>
          <CardDescription>
            Displaying minimum, median, and maximum salaries (in thousands)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-md">
                          <p className="font-medium">{label}</p>
                          {payload.map((item) => (
                            <p key={item.name} className="text-sm">
                              {item.name}: ${item.value}K
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="min" fill="#94a3b8" name="Min Salary (K)" />
                <Bar dataKey="median" fill="#64748b" name="Median Salary (K)" />
                <Bar dataKey="max" fill="#475569" name="Max Salary (K)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Industry Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Key Industry Trends</CardTitle>
            <CardDescription>
              Current trends shaping the industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {insights.keyTrends.map((trend, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Skills</CardTitle>
            <CardDescription>Skills to consider developing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.recommendedSkills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Insights Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Your Personalized Industry Overview</CardTitle>
          <CardDescription>
            Based on your profile as a {insights.position} in {insights.industry}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground leading-relaxed">
              {insights.industryAnalysis || generatePersonalizedSummary(insights)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardView;