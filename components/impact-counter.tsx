"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";

function CountUp({ end, duration = 2000 }: { end: number; duration?: number }) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    
    useEffect(() => {
        let start = 0;
        const increment = end / (duration / 16); // ~60fps
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [end, duration]);

    return <span>{count}</span>;
}

export function ImpactCounter() {
    const [stats, setStats] = useState<any>(null);
    const [prevStats, setPrevStats] = useState<any>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/get-impact-stats");
            const data = await res.json();
            if (data.stats) {
                setPrevStats(stats);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, []);

    const statItems = [
        { label: "Total Needs Submitted", value: stats?.totalNeeds },
        { label: "Volunteers Registered", value: stats?.totalVolunteers },
        { label: "Resolved This Month", value: stats?.resolvedThisMonth },
        { label: "Lives Impacted", value: stats?.livesImpacted },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Live Impact
                </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statItems.map((item, i) => (
                    <Card key={i} className="border-none bg-muted/30 shadow-none">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <div className="text-3xl font-bold tracking-tighter">
                                {item.value === undefined ? (
                                    "—"
                                ) : (
                                    <CountUp end={item.value} />
                                )}
                            </div>
                            <div className="text-[10px] uppercase font-medium text-muted-foreground mt-1 tracking-wider">
                                {item.label}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
