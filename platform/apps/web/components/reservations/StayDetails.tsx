import { Reservation, Site } from "@campreserv/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Tent, Users } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface StayDetailsProps {
    reservation: Reservation;
    site: Site;
}

export function StayDetails({ reservation, site }: StayDetailsProps) {
    const nights = differenceInDays(new Date(reservation.departureDate), new Date(reservation.arrivalDate));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Tent className="w-5 h-5 text-slate-500" />
                    Stay Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs text-slate-500 uppercase font-medium mb-1">Check In</div>
                        <div className="font-semibold text-slate-900">
                            {format(new Date(reservation.arrivalDate), "EEE, MMM d")}
                        </div>
                        <div className="text-sm text-slate-500">After 3:00 PM</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs text-slate-500 uppercase font-medium mb-1">Check Out</div>
                        <div className="font-semibold text-slate-900">
                            {format(new Date(reservation.departureDate), "EEE, MMM d")}
                        </div>
                        <div className="text-sm text-slate-500">Before 11:00 AM</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>Duration</span>
                        </div>
                        <span className="font-medium text-slate-900">{nights} Nights</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Tent className="w-4 h-4" />
                            <span>Site</span>
                        </div>
                        <div className="text-right">
                            <div className="font-medium text-slate-900">Site {site.siteNumber}</div>
                            <div className="text-xs text-slate-500 capitalize">{site.siteType.replace("_", " ")}</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Users className="w-4 h-4" />
                            <span>Guests</span>
                        </div>
                        <span className="font-medium text-slate-900">
                            {reservation.adults} Adults, {reservation.children} Children
                        </span>
                    </div>

                    {reservation.rigType && (
                        <div className="flex justify-between items-start py-2 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-slate-600">
                                <span className="text-lg">🚐</span>
                                <span>Equipment</span>
                            </div>
                            <div className="text-right">
                                <div className="font-medium text-slate-900 capitalize">
                                    {reservation.rigType === "rv" ? "RV / Motorhome" :
                                        reservation.rigType === "trailer" ? "Travel Trailer" :
                                            reservation.rigType === "tent" ? "Tent" :
                                                reservation.rigType === "car" ? "Car / Van" :
                                                    reservation.rigType}
                                </div>
                                {(reservation.rigLength || reservation.vehiclePlate) && (
                                    <div className="text-xs text-slate-500">
                                        {reservation.rigLength && `${reservation.rigLength}ft`}
                                        {reservation.rigLength && reservation.vehiclePlate && " • "}
                                        {reservation.vehiclePlate && (
                                            <span className="font-mono">
                                                {reservation.vehiclePlate}
                                                {reservation.vehicleState && ` (${reservation.vehicleState})`}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card >
    );
}
