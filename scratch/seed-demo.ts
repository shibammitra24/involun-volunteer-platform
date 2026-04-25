import { db } from "../lib/firebase-admin";

async function seedDemoVolunteer() {
    console.log("Seeding demo volunteer...");
    
    const demoVolunteer = {
        name: "Demo Volunteer",
        email: "demo.volunteer@involun.org",
        location: "Kolkata, WB",
        skills: ["First Aid", "Driving", "Logistics"],
        availability: "Full-time",
        created_at: new Date().toISOString()
    };

    try {
        // Check if exists
        const snapshot = await db.collection("volunteers")
            .where("name", "==", demoVolunteer.name)
            .get();

        if (snapshot.empty) {
            const docRef = await db.collection("volunteers").add(demoVolunteer);
            console.log("Demo volunteer created with ID:", docRef.id);
        } else {
            console.log("Demo volunteer already exists.");
        }
    } catch (err) {
        console.error("Error seeding volunteer:", err);
    }
}

seedDemoVolunteer().then(() => process.exit(0));
