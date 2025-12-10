import { Metadata } from "next";
import { HomeClient } from "./client";

export const metadata: Metadata = {
    title: "Camp Everyday - Find your perfect camping adventure",
    description: "Search and book campgrounds, RV parks, and cabins. Start your outdoor adventure today.",
};

export default function Home() {
    return <HomeClient />;
}
