"use client";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CurrentAffairsFiltersProps {
    category: string;
    onCategoryChange: (category: string) => void;
}

const CATEGORIES = ["All", "General", "National", "International", "Economy", "Science & Tech"];

export function CurrentAffairsFilters({ category, onCategoryChange }: CurrentAffairsFiltersProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filter:</span>
            <Select value={category} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-40">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                            {c}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Badge variant="outline" className="capitalize">
                {category}
            </Badge>
        </div>
    );
}