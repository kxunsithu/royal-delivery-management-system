import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

export default function UserDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: user, isLoading } = useQuery({ queryKey: ['user', id], queryFn: () => userService.get(Number(id)).then((r: any) => r.data.data) });

  const statusMutation = useMutation({
    mutationFn: (is_active: boolean) => userService.updateStatus(Number(id), is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user', id] }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: any) => userService.uploadProfileImage(Number(id), file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user', id] }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: () => userService.deleteProfileImage(Number(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user', id] }),
  });

  if (isLoading || !user) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const u = user as any;
  const canEdit = currentUser?.role === 'admin';

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (res.canceled) return;
    const a = res.assets[0];
    const file = { uri: a.uri, name: a.fileName || 'profile.jpg', type: a.mimeType || 'image/jpeg' } as any;
    uploadMutation.mutate(file);
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
      <View style={styles.profile}>
        {u.profile_image_url ? <Image source={{ uri: u.profile_image_url }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{u.name?.charAt(0)}</Text></View>}
        <Text style={styles.name}>{u.name}</Text>
        <Text style={styles.sub}>{u.role_display || u.role}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text><Text style={styles.value}>{u.email}</Text>
        <Text style={styles.label}>Phone</Text><Text style={styles.value}>{u.phone || '-'}</Text>
        <Text style={styles.label}>Employee ID</Text><Text style={styles.value}>{u.employee_id || '-'}</Text>
        <Text style={styles.label}>Active</Text><Text style={styles.value}>{u.is_active ? 'Yes' : 'No'}</Text>
        <Text style={styles.label}>Last Login</Text><Text style={styles.value}>{u.last_login_at || '-'}</Text>
      </View>

      {canEdit && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EditUser', { id: u.id })}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: u.is_active ? '#dc2626' : '#16a34a' }]} onPress={() => statusMutation.mutate(!u.is_active)}>
            <Text style={styles.buttonText}>{u.is_active ? 'Deactivate' : 'Activate'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={pickImage}>
            <Text style={styles.buttonSecondaryText}>Upload Photo</Text>
          </TouchableOpacity>
          {u.profile_image_url && (
            <TouchableOpacity style={[styles.buttonSecondary, { backgroundColor: '#fee2e2' }]} onPress={() => {
              Alert.alert('Delete photo?', '', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteImageMutation.mutate() },
              ]);
            }}>
              <Text style={[styles.buttonSecondaryText, { color: '#dc2626' }]}>Delete Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  back: { color: '#2563eb', marginBottom: 8 },
  profile: { alignItems: 'center', marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 8 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#6b7280' },
  name: { fontSize: 20, fontWeight: '700' },
  sub: { color: '#6b7280', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12 },
  label: { color: '#6b7280', fontSize: 12, marginTop: 8 },
  value: { fontSize: 14, marginTop: 2 },
  actions: { gap: 8, marginBottom: 24 },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonSecondary: { backgroundColor: '#e5e7eb', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  buttonSecondaryText: { color: '#374151', fontWeight: '600' },
});
