import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpecialDatesReportProps {
    campgroundId: string;
    dateRange: { start: string; end: string };
}

export function SpecialDatesReport({ campgroundId }: SpecialDatesReportProps) {
    return (
        <div className="space-y-6">
            <Card className="border-slate-200">
                <CardHeader className="flex flex-row items-center gap-3">
                    <CalendarClock className="h-6 w-6 text-slate-500" />
                    <div>
                        <CardTitle>Birthdays & Anniversaries</CardTitle>
                        <p className="text-sm text-slate-500">Upcoming special dates for in-house and arriving guests</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <CalendarClock className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Date Collection Required</h3>
                        <p className="text-sm text-slate-500">
                            To view upcoming birthdays and anniversaries, you must first enable "Ask for Date of Birth" in your Guest Intake settings.
                        </p>
                        <div className="pt-2">
                            <Button variant="outline" className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Configure Guest Intake Fields
                            </Button>
                        </div>
                        <p className="text-xs text-slate-400 mt-4">
                            Note: This features relies on the 'dateOfBirth' field on the Guest profile, which is currently not populated in the database schema.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
