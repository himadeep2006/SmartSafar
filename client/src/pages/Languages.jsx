import React, { useState } from 'react';
import { FaVolumeUp, FaCopy, FaDownload, FaLanguage } from 'react-icons/fa';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function Languages() {
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');
  const [textToTranslate, setTextToTranslate] = useState('My name is Vaishnavi');
  const [translatedText, setTranslatedText] = useState('Hindi: [Hindi translation] नमस्ते — My name is Vaishnavi');

  const languages = [
    { name: 'English', symbol: 'A' },
    { name: 'Hindi', symbol: 'हि' },
    { name: 'Tamil', symbol: 'த' },
    { name: 'Telugu', symbol: 'తె' },
    { name: 'Bengali', symbol: 'অ' },
    { name: 'Marathi', symbol: 'अ' },
    { name: 'Gujarati', symbol: 'ગુ' },
    { name: 'Kannada', symbol: 'ಕ' },
    { name: 'Malayalam', symbol: 'മ' },
    { name: 'Punjabi', symbol: 'ਅ' },
    { name: 'Odia', symbol: 'ଓ' },
    { name: 'Urdu', symbol: 'ا' },
  ];

  const handleTranslate = () => {
    setTranslatedText(
      `${selectedLanguage}: [${selectedLanguage} translation] — ${textToTranslate}`
    );
  };

  const handleSpeak = () => {
    alert(`Speaking in ${selectedLanguage}: "${translatedText}"`);
  };

  return (
    <PageContainer
      title="Regional Language Companion"
      subtitle="Connect seamlessly with local communities across India in their native language"
      badge="12+ INDIAN LANGUAGES SUPPORTED"
    >
      {/* Language Selection Grid */}
      <div>
        <SectionHeader
          title="Select Your Language"
          subtitle="Choose from India's major regional languages"
          icon={<FaLanguage />}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {languages.map((lang) => {
            const isSelected = selectedLanguage === lang.name;
            return (
              <button
                key={lang.name}
                onClick={() => setSelectedLanguage(lang.name)}
                className={`p-4 rounded-2xl transition-all duration-200 border text-center backdrop-blur-md ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/15 shadow-gold-glow scale-105'
                    : 'border-white/10 bg-slate-900/60 hover:border-amber-400/50 hover:bg-slate-900/80'
                }`}
              >
                <div className={`text-3xl font-extrabold mb-1.5 ${
                  isSelected ? 'text-amber-400' : 'text-slate-300'
                }`}>
                  {lang.symbol}
                </div>
                <p className={`text-xs font-bold uppercase tracking-wider ${
                  isSelected ? 'text-amber-300' : 'text-slate-400'
                }`}>
                  {lang.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Translation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card variant="glass" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Enter Text to Translate</h3>
            <Badge variant="blue" size="sm">INPUT</Badge>
          </div>

          <textarea
            value={textToTranslate}
            onChange={(e) => setTextToTranslate(e.target.value)}
            placeholder="Type your phrase or message here..."
            rows="6"
            className="smart-textarea resize-none"
          />

          <div className="flex gap-3 pt-2">
            <Button variant="gold" onClick={handleTranslate} fullWidth icon={<FaLanguage />}>
              Translate
            </Button>
            <Button variant="glass" onClick={handleSpeak} fullWidth icon={<FaVolumeUp />}>
              Speak
            </Button>
          </div>
        </Card>

        {/* Output Card */}
        <Card variant="glass" className="space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Translation Output</h3>
              <Badge variant="gold" size="sm">{selectedLanguage.toUpperCase()}</Badge>
            </div>

            <div className="p-6 bg-slate-950/80 rounded-2xl border border-amber-500/30 min-h-[160px] flex items-center justify-center text-center shadow-inner">
              <p className="text-amber-200 text-lg leading-relaxed font-medium">
                {translatedText}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth icon={<FaCopy />}>
              Copy Text
            </Button>
            <Button variant="secondary" fullWidth icon={<FaDownload />}>
              Download Audio
            </Button>
          </div>
        </Card>
      </div>

      {/* Language Overview */}
      <Card variant="solid" className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Supported Regional Dialects</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {languages.map((lang) => (
            <div key={lang.name} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <span className="text-2xl font-bold text-amber-400 block mb-1">{lang.symbol}</span>
              <span className="text-xs font-semibold text-slate-300">{lang.name}</span>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}

