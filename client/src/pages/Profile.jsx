import React, { useState } from "react";
import { FaEdit, FaSave, FaCamera } from "react-icons/fa";
import PageContainer from "../components/PageContainer";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";


export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  // Load saved profile data
  const storedProfile = JSON.parse(localStorage.getItem("profile"));

  const [formData, setFormData] = useState({
    firstName: storedProfile?.firstName || "",
    lastName: storedProfile?.lastName || "",
    email: storedProfile?.email || "",
    mobile: storedProfile?.mobile || "",
    city: storedProfile?.city || "",
    language: storedProfile?.language || "",
    interests: storedProfile?.interests || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem("profile", JSON.stringify(formData));
    setIsEditing(false);
  };

  const username = formData.firstName || "Explorer";
  const initials = username[0].toUpperCase();

  return (
    <PageContainer
      title="Traveller Profile"
      subtitle="Manage your personal details, preferred languages, and travel preferences"
      badge="SMARTSAFAR ACCOUNT"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Avatar Card */}
        <Card variant="glass" className="lg:col-span-1 h-fit text-center p-6 space-y-4">
          <div className="relative inline-block">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-500 flex items-center justify-center mx-auto shadow-gold-glow border-2 border-amber-300">
              <span className="text-5xl font-extrabold text-slate-950">
                {initials}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-full border-2 border-slate-900 shadow-md">
              <FaCamera className="text-xs" />
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white capitalize">
              {formData.firstName || "Your Name"} {formData.lastName || ""}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {formData.email || "your.email@example.com"}
            </p>
          </div>

          <Badge variant="gold" size="md" className="w-full justify-center">
            PRO EXPLORER
          </Badge>
        </Card>

        {/* Profile Form Card */}
        <Card variant="glass" className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div>
              <h3 className="text-xl font-bold text-white">Personal Information</h3>
              <p className="text-xs text-slate-400">Update your account information and preferences</p>
            </div>

            <Button
              variant={isEditing ? "gold" : "glass"}
              size="sm"
              onClick={() => {
                if (isEditing) handleSave();
                else setIsEditing(true);
              }}
              icon={isEditing ? <FaSave /> : <FaEdit />}
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* First Name */}
            <div>
              <label className="smart-label">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="First Name"
                className="smart-input"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="smart-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Last Name"
                className="smart-input"
              />
            </div>

            {/* Email */}
            <div>
              <label className="smart-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Email Address"
                className="smart-input"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="smart-label">Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Mobile Number"
                className="smart-input"
              />
            </div>

            {/* City */}
            <div>
              <label className="smart-label">Home City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="City"
                className="smart-input"
              />
            </div>

            {/* Language */}
            <div>
              <label className="smart-label">Preferred Native Language</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                disabled={!isEditing}
                className="smart-select"
              >
                <option value="" className="bg-slate-900 text-slate-300">Select Language</option>
                <option className="bg-slate-900 text-white">English</option>
                <option className="bg-slate-900 text-white">Hindi</option>
                <option className="bg-slate-900 text-white">Tamil</option>
                <option className="bg-slate-900 text-white">Telugu</option>
                <option className="bg-slate-900 text-white">Bengali</option>
                <option className="bg-slate-900 text-white">Marathi</option>
                <option className="bg-slate-900 text-white">Gujarati</option>
                <option className="bg-slate-900 text-white">Kannada</option>
              </select>
            </div>

            {/* Interests */}
            <div className="md:col-span-2">
              <label className="smart-label">Travel Interests & Notes</label>
              <textarea
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Share your travel style (e.g., Heritage trails, Mountain trekking, Culinary tours...)"
                rows="4"
                className="smart-textarea"
              />
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}