import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking,
} from 'react-native';
import { COLORS, FONT_FAMILY } from '../constants/theme';
import {
  MapPin, Wrench, Droplet, Zap, Wind, StopCircle, CircleDashed, Settings, Link, Battery
} from 'lucide-react-native';

// Hallmark - genre: modern-minimal - macrostructure: Editorial/Magazine - design-system: none - designed-as-app
// Structural fingerprint: Huge magazine heading, Asymmetric list (left category, right items), Negative space dividers, Pill buttons

interface WorkshopScreenProps {
  onGoBack: () => void;
}

const GOOGLE_MAPS_SEARCH_URL = 'https://www.google.com/maps/search/bengkel+motor+terdekat';

const MAINTENANCE_CATEGORIES = [
  {
    category: 'MESIN & OLI',
    items: [
      { iconId: 'droplet', title: 'Oli Mesin', desc: 'Ganti oli setiap 2.000 - 4.000 km, tergantung jenis oli dan pemakaian.', tags: ['VITAL', 'RUTIN'] },
      { iconId: 'thermometer', title: 'Air Radiator', desc: 'Periksa coolent setiap 8.000 km. Mesin overheat sering terjadi karena cairan habis.', tags: ['LIQUID'] },
      { iconId: 'wind', title: 'Filter Udara', desc: 'Bersihkan setiap servis, ganti jika sudah terlalu kotor (sekitar 15.000 km).', tags: ['FILTER'] },
    ]
  },
  {
    category: 'PENGEREMAN',
    items: [
      { iconId: 'stopcircle', title: 'Kampas Rem', desc: 'Cek ketebalan kampas setiap bulan. Ganti jika mulai terdengar suara decitan.', tags: ['SAFETY'] },
      { iconId: 'droplet', title: 'Minyak Rem', desc: 'Kuras dan ganti minyak rem setiap 20.000 km atau 2 tahun sekali agar pengereman optimal.', tags: ['LIQUID', 'SAFETY'] },
    ]
  },
  {
    category: 'PENGGERAK',
    items: [
      { iconId: 'circledashed', title: 'V-Belt / Rantai', desc: 'Cek ketegangan rantai tiap 1.000 km. Untuk matic, ganti V-Belt tiap 20.000 - 25.000 km.', tags: ['CRITICAL'] },
      { iconId: 'settings', title: 'Oli Gardan', desc: 'Khusus matic, ganti oli gardan setiap 8.000 - 10.000 km untuk transmisi halus.', tags: ['LIQUID'] },
    ]
  },
  {
    category: 'KELISTRIKAN',
    items: [
      { iconId: 'battery', title: 'Aki (Battery)', desc: 'Ganti aki jika starter mulai berat atau lampu meredup. Usia normal aki 1.5 - 2 tahun.', tags: ['POWER'] },
      { iconId: 'zap', title: 'Busi', desc: 'Ganti busi setiap 8.000 - 10.000 km agar pembakaran sempurna dan irit bensin.', tags: ['POWER'] },
    ]
  }
];

const renderIcon = (id: string, color: string) => {
  switch (id) {
    case 'droplet':
    case 'thermometer': return <Droplet size={20} color={color} strokeWidth={1.5} />;
    case 'zap': return <Zap size={20} color={color} strokeWidth={1.5} />;
    case 'wind': return <Wind size={20} color={color} strokeWidth={1.5} />;
    case 'stopcircle': return <StopCircle size={20} color={color} strokeWidth={1.5} />;
    case 'circledashed': return <CircleDashed size={20} color={color} strokeWidth={1.5} />;
    case 'settings': return <Settings size={20} color={color} strokeWidth={1.5} />;
    case 'link': return <Link size={20} color={color} strokeWidth={1.5} />;
    case 'battery': return <Battery size={20} color={color} strokeWidth={1.5} />;
    default: return <Wrench size={20} color={color} strokeWidth={1.5} />;
  }
};

export default function WorkshopScreen({ onGoBack }: WorkshopScreenProps) {
  const { colors: COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const handleOpenMaps = async () => {
    try {
      await Linking.openURL(GOOGLE_MAPS_SEARCH_URL);
    } catch {
      Alert.alert('Gagal Membuka Peta', 'Tidak dapat membuka Google Maps.',
        [{ text: 'Batal', style: 'cancel' },
        { text: 'Buka di Browser', onPress: () => Linking.openURL(GOOGLE_MAPS_SEARCH_URL).catch(() => { }) }]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Minimal Top Nav */}
      <View style={styles.topNav}>
        {onGoBack && (
          <TouchableOpacity onPress={onGoBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Text style={styles.navLink}>← Back to Index</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Magazine Editorial Header */}
        <View style={styles.editorialHeader}>
          <Text style={styles.editorialTitle}>WORKSHOP{'\n'}& DIRECTIVE.</Text>
          
          <TouchableOpacity style={styles.pillButton} onPress={handleOpenMaps} activeOpacity={0.8}>
            <MapPin size={16} color={COLORS.bg} strokeWidth={2} />
            <Text style={styles.pillButtonText}>Locate Nearby Mechanics</Text>
          </TouchableOpacity>
          <Text style={styles.pillCaption}>Opens external Google Maps application</Text>
        </View>

        {/* Asymmetric List */}
        <View style={styles.directiveSection}>
          <Text style={styles.sectionHeading}>Maintenance Playbook</Text>
          
          {MAINTENANCE_CATEGORIES.map((cat, catIdx) => (
            <View key={catIdx} style={styles.categoryBlock}>
              {/* Left Column: Category Name */}
              <View style={styles.catLeft}>
                <Text style={styles.catTitle}>{cat.category}</Text>
              </View>

              {/* Right Column: Items */}
              <View style={styles.catRight}>
                {cat.items.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <View style={styles.tipHeaderRow}>
                      <View style={styles.tipIcon}>
                        {renderIcon(tip.iconId, COLORS.textPrimary)}
                      </View>
                      <Text style={styles.tipTitle}>{tip.title}</Text>
                    </View>
                    
                    <Text style={styles.tipDesc}>{tip.desc}</Text>
                    
                    <View style={styles.tipTags}>
                      {tip.tags.map((tag, i) => (
                        <Text key={i} style={styles.tipTagText}>#{tag}</Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const getStyles = (COLORS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  topNav: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16,
  },
  navLink: { fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.textSecondary },

  scrollContent: { paddingBottom: 120 },

  editorialHeader: {
    paddingHorizontal: 24, paddingTop: 40, paddingBottom: 56,
  },
  editorialTitle: { 
    fontFamily: FONT_FAMILY.display, fontSize: 44, fontWeight: '300', 
    color: COLORS.textPrimary, letterSpacing: -1, lineHeight: 48,
    marginBottom: 40
  },
  
  pillButton: {
    backgroundColor: COLORS.textPrimary, borderRadius: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, paddingHorizontal: 24,
    alignSelf: 'flex-start'
  },
  pillButtonText: { 
    fontFamily: FONT_FAMILY.bodyBold, fontSize: 14, color: COLORS.bg, letterSpacing: 0.5 
  },
  pillCaption: {
    fontFamily: FONT_FAMILY.mono, fontSize: 11, color: COLORS.textTertiary,
    marginTop: 12, marginLeft: 16
  },

  directiveSection: {
    paddingTop: 40, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  sectionHeading: {
    fontFamily: FONT_FAMILY.mono, fontSize: 12, color: COLORS.textTertiary,
    letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: 24, marginBottom: 40
  },

  categoryBlock: {
    flexDirection: 'column', 
    paddingHorizontal: 24, marginBottom: 48,
  },
  catLeft: {
    marginBottom: 24,
  },
  catTitle: {
    fontFamily: FONT_FAMILY.mono, fontSize: 13, color: COLORS.primary, letterSpacing: 1,
  },
  catRight: {
    paddingLeft: 0,
  },

  tipItem: {
    marginBottom: 40,
  },
  tipHeaderRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12
  },
  tipIcon: {
    width: 32, height: 32, borderRadius: 16, 
    backgroundColor: COLORS.surface1,
    justifyContent: 'center', alignItems: 'center',
  },
  tipTitle: { 
    fontFamily: FONT_FAMILY.display, fontSize: 20, color: COLORS.textPrimary, letterSpacing: -0.5
  },
  tipDesc: { 
    fontFamily: FONT_FAMILY.body, fontSize: 15, color: COLORS.textSecondary, lineHeight: 24,
    marginBottom: 12
  },
  
  tipTags: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12
  },
  tipTagText: { 
    fontFamily: FONT_FAMILY.mono, fontSize: 11, color: COLORS.textTertiary, letterSpacing: 0.5 
  },
});
