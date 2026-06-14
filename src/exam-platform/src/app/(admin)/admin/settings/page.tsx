"use client";

import { useAdminDashboard } from "@/lib/api";
import {
  Settings as SettingsIcon,
  ExternalLink,
  Info,
  HardDrive,
  Cloud,
  Database,
  BarChart3,
  Image,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { contact_gmail, contact_number, contact_address } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { data: dashboard, isLoading } = useAdminDashboard();

  const storageMb = dashboard?.stats?.storageUsedMb ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-2">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-indigo-600" />
          Settings
        </h1>
        <p className="text-gray-500 mt-2">
          Application configuration, storage details, and contact information.
        </p>
      </div>

      {/* Cloudinary Storage Card */}
      <Card className="border border-border/50 bg-white shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600" /> Cloudinary Storage
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Media and document storage usage for NCERT PDFs, PYP papers, and
            uploaded files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-100">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                    <HardDrive className="w-4.5 h-4.5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">
                      Storage Used
                    </p>
                    <p className="text-xl font-black text-violet-900">
                      {storageMb.toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-violet-500/70">
                  Cloudinary CDN — raw PDFs & media
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-sky-100">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Database className="w-4.5 h-4.5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">
                      Cloud Name
                    </p>
                    <p className="text-sm font-bold text-sky-900 truncate max-w-[160px]">
                      {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
                        "Configured via env"}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-sky-500/70">
                  Cloudinary cloud name from environment
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <BarChart3 className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                      Document Count
                    </p>
                    <p className="text-xl font-black text-emerald-900">
                      {Math.floor((dashboard?.totalQuestions ?? 0) / 10)}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-500/70">
                  NCERT & PYP documents in storage
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border border-border/50 bg-white shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-600" /> Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Support Email
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {contact_gmail}
              </p>
            </div>
            <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Contact Number
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {contact_number}
              </p>
            </div>
            <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 md:col-span-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Address
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {contact_address}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
