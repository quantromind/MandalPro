import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageModal({ visible, onClose, canDismiss = true }) {
  const { language, setLanguage, t } = useLanguage();

  if (!visible) return null;

  const handleSelect = (lang) => {
    setLanguage(lang);
    if (onClose) onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        if (canDismiss && onClose) onClose();
      }}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <View style={styles.card}>
            {/* Header Icon */}
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🌐</Text>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>
              {language === 'mr' ? 'भाषा निवडा' : 'Select Language'}
            </Text>
            <Text style={styles.subtitle}>
              {language === 'mr'
                ? 'अ‍ॅप्लिकेशनसाठी तुमची पसंतीची भाषा निवडा'
                : 'Select your preferred language for the application'}
            </Text>

            {/* Language Options */}
            <View style={styles.optionsContainer}>
              {/* English Option */}
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  language === 'en' && styles.optionCardSelected
                ]}
                onPress={() => handleSelect('en')}
                activeOpacity={0.85}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionFlag}>🇬🇧</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[
                        styles.optionLabel,
                        language === 'en' && styles.optionLabelSelected
                      ]}
                    >
                      English
                    </Text>
                    <Text style={styles.optionSub}>Default Language</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      language === 'en' && styles.radioCircleSelected
                    ]}
                  >
                    {language === 'en' && <View style={styles.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Marathi Option */}
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  language === 'mr' && styles.optionCardSelected
                ]}
                onPress={() => handleSelect('mr')}
                activeOpacity={0.85}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionFlag}>🚩</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[
                        styles.optionLabel,
                        language === 'mr' && styles.optionLabelSelected
                      ]}
                    >
                      मराठी
                    </Text>
                    <Text style={styles.optionSub}>मराठी भाषा (Devanagari)</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      language === 'mr' && styles.radioCircleSelected
                    ]}
                  >
                    {language === 'mr' && <View style={styles.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Note */}
            <Text style={styles.note}>
              {language === 'mr'
                ? '💡 तुम्ही ही निवड नंतर प्रोफाइल स्क्रीनमधून कधीही बदलू शकता.'
                : '💡 You can change this setting anytime from your Profile screen.'}
            </Text>

            {/* Close Button if dismissable */}
            {canDismiss && onClose && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeBtnText}>
                  {language === 'mr' ? 'पूर्ण करा ✓' : 'Done ✓'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center'
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  iconText: {
    fontSize: 28
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172554',
    textAlign: 'center',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 8
  },
  optionsContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 14
  },
  optionCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: '#E2E8F0'
  },
  optionCardSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316'
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  optionFlag: {
    fontSize: 24
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B'
  },
  optionLabelSelected: {
    color: '#EA580C',
    fontWeight: '800'
  },
  optionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioCircleSelected: {
    borderColor: '#F97316'
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F97316'
  },
  note: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14
  },
  closeBtn: {
    width: '100%',
    backgroundColor: '#172554',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15
  }
});
