from typing import Protocol

from ..schemas import TripPreferences


# Concrete suggestions drawn from the existing catalogue descriptions and widely known
# destination landmarks. These are suggestions only; schedules/access are not live data.
DESTINATION_DAY_STOPS = {
    "goa": [["Old Goa churches", "Old Goa heritage quarter"], ["Fort Aguada", "Candolim coast"], ["Panaji riverfront", "Fontainhas quarter"]],
    "varkala": [["Varkala Cliff", "cliffside cafés and paths"], ["Papanasam Beach", "Janardanaswamy Temple area"], ["Varkala town", "nearby coastal viewpoints"]],
    "puri": [["Jagannath Temple area", "Puri old town"], ["Puri Beach", "coastal promenade"], ["Chilika Lagoon (day trip)", "return to Puri"]],
    "manali": [["Old Manali", "Hidimba Devi Temple area"], ["Beas River promenade", "Manali market"], ["Naggar (separate outing)", "allow a flexible return"]],
    "gulmarg": [["Gulmarg meadow", "Gulmarg town"], ["Gondola base area", "nearby meadow paths"], ["St Mary's Church", "Gulmarg meadow"]],
    "darjeeling": [["Chowrasta Mall", "Darjeeling Himalayan Railway area"], ["Tea estate visit", "nearby tea garden viewpoint"], ["Batasia Loop area", "Ghoom area"]],
    "jaipur": [["Amber Fort", "Jaigarh Fort area"], ["City Palace", "Jantar Mantar area"], ["Hawa Mahal area", "Jaipur walled city bazaars"]],
    "agra": [["Taj Mahal", "Mehtab Bagh area"], ["Agra Fort", "old city market area"], ["Itimad-ud-Daulah area", "Yamuna riverfront"]],
    "hampi": [["Hampi bazaar", "Virupaksha Temple area"], ["Vijaya Vittala Temple complex", "riverside path"], ["Hemakuta Hill", "Hampi bazaar"]],
    "kaziranga": [["Licensed park visit (seasonal)", "return to your booked base"], ["Kohora area", "local nature interpretation"], ["Licensed park visit (seasonal)", "return to your booked base"]],
    "alleppey": [["Alappuzha beach", "Alappuzha lighthouse area"], ["Backwater village boat experience", "return to the same boarding area"], ["Alappuzha town", "canal-side neighbourhood"]],
    "varanasi": [["Dashashwamedh Ghat", "nearby old-city ghats"], ["Sarnath", "Sarnath archaeological area"], ["Assi Ghat", "Banaras Hindu University area"]],
    "rishikesh": [["Ram Jhula area", "nearby riverfront"], ["Triveni Ghat", "Rishikesh market"], ["Neer Garh Waterfall trail", "return to Rishikesh"]],
    "mumbai": [["Gateway of India", "Colaba Causeway"], ["Chhatrapati Shivaji Maharaj Vastu Sangrahalaya", "Kala Ghoda district"], ["Marine Drive", "Mumbai waterfront"]],
    "kochi": [["Fort Kochi", "Chinese fishing nets waterfront"], ["Mattancherry Palace area", "Jew Town"], ["Ernakulam waterfront", "Fort Kochi ferry area"]],
}


class TripPlannerProvider(Protocol):
    label: str

    def generate(self, destination, preferences: TripPreferences) -> list[dict]: ...


class PreferenceBasedTripPlanner:
    """Deterministic, credential-free planner. Suggestions require traveler verification."""

    label = "Smart itinerary generated from your preferences"

    def generate(self, destination, preferences: TripPreferences) -> list[dict]:
        tags = destination.tags or [destination.name]
        day_stops = DESTINATION_DAY_STOPS.get(destination.id, [[destination.name, f"{destination.name} nearby area"]])
        style = preferences.travel_style
        pace_note = {
            "relaxed": "Keep both blocks optional and include a longer rest break.",
            "adventure": "Only add outdoor activities with a qualified local operator and suitable current conditions.",
            "culture": "Allow time for local customs and site entry rules.",
            "food": "Leave room to explore regional dining nearby.",
            "budget": "Favor self-guided or lower-cost options and confirm entry fees in advance.",
            "balanced": "Keep a flexible buffer between stops.",
        }[style]
        days = []
        for index in range(preferences.duration_days):
            focus = preferences.interests[index % len(preferences.interests)]
            activity = preferences.preferred_activities[index % len(preferences.preferred_activities)] if preferences.preferred_activities else focus
            morning_place, afternoon_place = day_stops[index % len(day_stops)]
            flexible_day = index >= len(day_stops)
            evening_place = f"{destination.name} local neighbourhood"
            daily = preferences.budget_inr // preferences.duration_days
            meals = ["Breakfast near your stay", "Lunch featuring regional cuisine", "Dinner at a locally reviewed restaurant"]
            days.append({
                "day_number": index + 1,
                "title": f"Day {index + 1}: {'flexible local discoveries' if flexible_day else f'{focus.title()} and local discovery'}",
                "morning": {"title": f"Explore {morning_place}", "description": "Keep this flexible as a rest, weather buffer, or return to a favourite area." if flexible_day else f"Start at an unhurried pace around {focus}; consider {activity} if it suits the area.", "place": morning_place, "estimated_travel_time": "Allow flexible transfer time and verify the route locally.", "meal_suggestion": meals[0], "estimated_spending_inr": round(daily * .28)},
                "afternoon": {"title": f"Continue near {morning_place}", "description": "Choose one relaxed activity in the same area, or keep the afternoon free." if flexible_day else f"Choose one nearby experience aligned with {', '.join(preferences.interests[:2])}. {pace_note}", "place": afternoon_place, "estimated_travel_time": "Grouped as a nearby area; traffic and access vary.", "meal_suggestion": meals[1], "estimated_spending_inr": round(daily * .42)},
                "evening": {"title": f"Unwind around {destination.name}", "description": "Leave time to rest, enjoy the local atmosphere, and return safely before late hours.", "place": evening_place, "estimated_travel_time": "Prefer a short local transfer or walk where safe.", "meal_suggestion": meals[2], "estimated_spending_inr": round(daily * .30)},
                "estimated_daily_spending_inr": daily,
                "travel_notes": ("Suggestions are based on curated destination stops, not live opening hours or route data. Check access, weather, and local advisories; leave flexible time between stops. "
                    + f"The ₹{preferences.budget_inr:,} total is allocated across {preferences.duration_days} days for {preferences.companions} traveller(s); actual costs vary. "
                    + (f"Plan a separate arrival transfer from {preferences.starting_location}; route time is not estimated. " if index == 0 and preferences.starting_location else "")),
            })
        return days


planner: TripPlannerProvider = PreferenceBasedTripPlanner()
