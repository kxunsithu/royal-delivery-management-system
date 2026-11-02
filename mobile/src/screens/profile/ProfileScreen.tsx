import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import userService from '../../services/userService';

export default function ProfileScreen() {
  const { user: authUser, updateUser } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: () => userService.get(authUser!.id).then((r: any) => r.data.data),
    enabled: !!authUser?.id,
  });

  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, name: (user as any).name ?? '', phone: (user as any).phone ?? '' }));
    }
  }, [user]);

  const uploadMutation = useMutation({
    mutationFn: async (file: any) => userService.uploadProfileImage(authUser!.id, file),
    onSuccess: (res: any) => {
      const updated = res?.data?.data;
      if (updated) updateUser(updated);
      qc.invalidateQueries({ queryKey: ['profile', authUser?.id] });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: () => userService.deleteProfileImage(authUser!.id),
    onSuccess: (res: any) => {
      const updated = res?.data?.data;
      if (updated) updateUser(updated);
      qc.invalidateQueries({ queryKey: ['profile', authUser?.id] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: any = { name: form.name };
      if (form.phone) payload.phone = form.phone;
      if (form.password) payload.password = form.password;
      return userService.update(authUser!.id, payload);
    },
    onSuccess: (res: any) => {
      const updated = res?.data?.data;
      if (updated) updateUser(updated);
      qc.invalidateQueries({ queryKey: ['profile', authUser?.id] });
      setForm(f => ({ ...f, password: '', confirm_password: '' }));
      Alert.alert('Saved');
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message || 'Failed'),
  });

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (res.canceled) return;
    const a = res.assets[0];
    uploadMutation.mutate({ uri: a.uri, name: a.fileName || 'profile.jpg', type: a.mimeType || 'image/jpeg' } as any);
  };

  if (isLoading || !authUser) return <ActivityIndicator style={{ marginTop: 40 }} />;

  const profileUrl = (user as any)?.profile_image_url || authUser.profile_image_url;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.avatarRow}>
        {profileUrl ? <Image source={{ uri: profileUrl }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{authUser.name?.charAt(0)}</Text></View>}
        <View style={{ gap: 8 }}>
          <TouchableOpacity style={styles.buttonSecondary} onPress={pickImage}><Text style={styles.buttonSecondaryText}>Upload Photo</Text></TouchableOpacity>
          {profileUrl && (
            <TouchableOpacity style={[styles.buttonSecondary, { backgroundColor: '#fee2e2' }]} onPress={() => {
              Alert.alert('Remove photo?', '', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => deleteImageMutation.mutate() },
              ]);
            }}>
              <Text style={[styles.buttonSecondaryText, { color: '#dc2626' }]}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm(f => ({ ...f, name: v }))} />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={(v) => setForm(f => ({ ...f, phone: v }))} keyboardType="phone-pad" />
        <Text style={styles.label}>New Password (optional)</Text>
        <View style={styles.passwordRow}>
          <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={form.password} onChangeText={(v) => setForm(f => ({ ...f, password: v }))} secureTextEntry={!showPassword} />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
            <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.passwordRow}>
          <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={form.confirm_password} onChangeText={(v) => setForm(f => ({ ...f, confirm_password: v }))} secureTextEntry={!showConfirmPassword} />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(v => !v)}>
            <Text style={styles.eyeText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => {
        if (form.password && form.password !== form.confirm_password) { Alert.alert('Passwords do not match'); return; }
        saveMutation.mutate();
      }} disabled={saveMutation.isPending}>
        <Text style={styles.buttonText}>{saveMutation.isPending ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#6b7280' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12 },
  label: { fontSize: 12, color: '#6b7280', marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#d1d5db' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonSecondary: { backgroundColor: '#e5e7eb', borderRadius: 8, padding: 10, alignItems: 'center' },
  buttonSecondaryText: { color: '#374151', fontWeight: '600' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  eyeBtn: { paddingHorizontal: 10, paddingVertical: 10 },
  eyeText: { color: '#2563eb', fontWeight: '600' },
});
