
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import typography from '../../constants/typography';

export default function VehiclesScreen({ navigation }) {
  const [vehicles] = useState([]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>МОЯТ AUTOLOG</Text>
          <Text style={styles.title}>Моят гараж</Text>
        </View>

        <View style={styles.countBadge}>
          <Ionicons
            name="car-sport-outline"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.countText}>{vehicles.length}</Text>
        </View>
      </View>

      <Text style={styles.description}>
        Всички твои автомобили на едно място.
      </Text>

      {vehicles.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="car-sport-outline"
              size={48}
              color={colors.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            Гаражът ти е празен
          </Text>

          <Text style={styles.emptyDescription}>
            Добави първия си автомобил, за да следиш неговото
            обслужване, разходи и предстоящи напомняния.
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('VehicleForm')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={colors.background} />
            <Text style={styles.addButtonText}>
              Добави автомобил
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {/* Списъкът с автомобилите ще бъде добавен тук. */}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  subtitle: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },

  title: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: '700',
  },

  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  countText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  description: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },

  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    gap: spacing.sm,
    width: '100%',
  },

  addButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
});
