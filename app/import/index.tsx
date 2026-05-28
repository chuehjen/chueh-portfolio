import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { recognizeHoldingsFromImage, convertToHoldings, RecognizedHolding } from '../../src/data/ocr-service';
import { parseCSV } from '../../src/data/csv-parser';
import { Holding } from '../../src/domain/types';
import { upsertHolding, clearAllHoldings, getHoldings } from '../../src/data/storage';

export default function ImportScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recognized, setRecognized] = useState<RecognizedHolding[] | null>(null);
  const [source, setSource] = useState<string>('');
  const [importing, setImporting] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('权限不足', '请在设置中允许访问相册/相机');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (result.canceled || !result.assets?.length) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    setRecognized(null);
    await recognizeImage(uri);
  };

  const recognizeImage = async (uri: string) => {
    setRecognizing(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await recognizeHoldingsFromImage(base64);
      setRecognized(result.holdings);
      setSource(result.source);

      if (result.holdings.length === 0) {
        Alert.alert('未识别到持仓', '请确保截图包含完整的持仓列表');
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      Alert.alert('识别失败', msg.substring(0, 300));
    } finally {
      setRecognizing(false);
    }
  };

  const confirmImport = async (merge: boolean) => {
    if (!recognized || recognized.length === 0) return;
    setImporting(true);

    try {
      if (!merge) await clearAllHoldings();

      const holdings = convertToHoldings(recognized);
      for (const h of holdings) {
        await upsertHolding(h);
      }

      Alert.alert(
        '导入成功',
        `成功导入 ${holdings.length} 只持仓`,
        [{ text: '查看总览', onPress: () => router.replace('/') }]
      );
    } catch (e) {
      Alert.alert('导入失败', String(e));
    } finally {
      setImporting(false);
    }
  };

  const handleConfirm = async () => {
    const existing = await getHoldings();
    if (existing.length > 0) {
      Alert.alert('选择导入方式', `当前已有 ${existing.length} 只持仓`, [
        { text: '合并', onPress: () => confirmImport(true) },
        { text: '替换全部', style: 'destructive', onPress: () => confirmImport(false) },
        { text: '取消', style: 'cancel' },
      ]);
    } else {
      await confirmImport(true);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        截图你的券商持仓页面，AI 帮你一键识别
      </Text>

      {/* Screenshot Import (Primary) */}
      <View style={styles.actionGroup}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => pickImage(false)}>
          <Text style={styles.primaryBtnText}>从相册选择截图</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickImage(true)}>
          <Text style={styles.secondaryBtnText}>拍照识别</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.supportText}>支持：富途牛牛、FirstTrade 持仓截图</Text>

      {/* Image Preview */}
      {imageUri && (
        <View style={styles.previewImageContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
        </View>
      )}

      {/* Recognizing */}
      {recognizing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C851" />
          <Text style={styles.loadingText}>AI 正在识别持仓数据...</Text>
        </View>
      )}

      {/* Recognized Result */}
      {recognized && recognized.length > 0 && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>识别结果</Text>
            <Text style={styles.resultBadge}>
              {source === 'futu' ? '富途' : source === 'firstrade' ? 'FirstTrade' : '未知来源'}
            </Text>
          </View>

          {recognized.map((h, i) => (
            <View key={i} style={styles.resultRow}>
              <View style={styles.resultLeft}>
                <Text style={styles.resultSymbol}>{h.symbol}</Text>
                <Text style={styles.resultName}>{h.name}</Text>
              </View>
              <View style={styles.resultRight}>
                <Text style={styles.resultShares}>{h.shares} 股</Text>
                <Text style={styles.resultCost}>成本 {h.currency === 'HKD' ? 'HK$' : '$'}{h.costBasisPerShare}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.confirmBtnText}>确认导入 {recognized.length} 只持仓</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFE' },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#8E8EA0', lineHeight: 20 },
  actionGroup: { gap: 10 },
  primaryBtn: {
    backgroundColor: '#00C851',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00C851',
  },
  secondaryBtnText: { color: '#00C851', fontSize: 15, fontWeight: '700' },
  supportText: { fontSize: 12, color: '#B0B0C0', textAlign: 'center' },
  previewImageContainer: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewImage: { width: '100%', height: 200, borderRadius: 10 },
  loadingContainer: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  loadingText: { fontSize: 14, color: '#8E8EA0' },
  resultCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#00C851',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  resultBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00C851',
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F5',
  },
  resultLeft: { flex: 1 },
  resultSymbol: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  resultName: { fontSize: 11, color: '#8E8EA0', marginTop: 2 },
  resultRight: { alignItems: 'flex-end' },
  resultShares: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  resultCost: { fontSize: 11, color: '#8E8EA0', marginTop: 2 },
  confirmBtn: {
    backgroundColor: '#00C851',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
