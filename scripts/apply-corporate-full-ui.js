import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, '..', 'mobile_app', 'screens', 'DashboardScreen.jsx');

let content = fs.readFileSync(file, 'utf8');

// 1. Insert Corporate Modal before the last </SafeAreaView>
const modalCode = `
      {/* Corporate Workplace & Employee ID Verification Modal */}
      <Modal
        visible={showCorporateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCorporateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.corporateLogoBox, { width: 34, height: 34, marginRight: 8 }]}>
                  <MaterialCommunityIcons name="domain" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Corporate Membership</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>PecoDrop Campus Recycling</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCorporateModal(false)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {isEnterprise ? (
                /* Already Verified Enterprise Member View */
                <View>
                  <View style={styles.corpVerifiedBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <MaterialCommunityIcons name="shield-check" size={22} color="#10B981" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#065F46' }}>
                        Verified Corporate Account
                      </Text>
                    </View>

                    <View style={styles.corpVerifiedRow}>
                      <Text style={styles.corpVerifiedLabel}>Organization:</Text>
                      <Text style={styles.corpVerifiedVal}>{orgName}</Text>
                    </View>

                    <View style={styles.corpVerifiedRow}>
                      <Text style={styles.corpVerifiedLabel}>Staff ID:</Text>
                      <Text style={styles.corpVerifiedVal}>{employeeId || 'Active Member'}</Text>
                    </View>

                    {department ? (
                      <View style={styles.corpVerifiedRow}>
                        <Text style={styles.corpVerifiedLabel}>Department:</Text>
                        <Text style={styles.corpVerifiedVal}>{department}</Text>
                      </View>
                    ) : null}

                    <View style={styles.corpVerifiedRow}>
                      <Text style={styles.corpVerifiedLabel}>Kiosk Access:</Text>
                      <Text style={[styles.corpVerifiedVal, { color: '#0284C7' }]}>
                        PecoDrop (⭕ Plastic, 🔺 Cans, 🟦 Paper)
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 16 }}>
                    Your recycling contributions are synchronized with {orgName}'s corporate ESG dashboard and cafeteria discount perks.
                  </Text>

                  <TouchableOpacity
                    style={styles.corpUnlinkBtn}
                    onPress={handleUnlinkCorporateAccount}
                    disabled={corpLoading}
                  >
                    {corpLoading ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="link-off" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                        <Text style={styles.corpUnlinkText}>Disconnect Corporate Workplace</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Citizen Linking View */
                <View>
                  <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 12 }}>
                    Working at a registered corporate campus? Enter your company code and employee ID to unlock exclusive cafeteria perks and PecoDrop smart kiosks.
                  </Text>

                  {/* Partner Quick-Select Chips */}
                  <Text style={styles.modalLabel}>Select Partner Company:</Text>
                  <View style={styles.corpChipGrid}>
                    {availableOrgs.map(org => {
                      const isSelected = corpCompanyCode.toUpperCase() === (org.code || '').toUpperCase() ||
                                         corpCompanyCode.toUpperCase() === (org.org_id || '').toUpperCase();
                      return (
                        <TouchableOpacity
                          key={org.org_id || org.name}
                          style={[styles.corpChip, isSelected && styles.corpChipSelected]}
                          onPress={() => setCorpCompanyCode(org.code || org.org_id.replace('ORG_', ''))}
                        >
                          <MaterialCommunityIcons 
                            name="domain" 
                            size={14} 
                            color={isSelected ? "#0284C7" : "#64748B"} 
                            style={{ marginRight: 4 }} 
                          />
                          <Text style={[styles.corpChipText, isSelected && styles.corpChipTextSelected]}>
                            {org.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Company Code Input */}
                  <Text style={styles.modalLabel}>Company Code or Corporate Domain *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. ENGRO, ALFALAH, UCP, METRO or engro.com"
                    placeholderTextColor="#94A3B8"
                    value={corpCompanyCode}
                    onChangeText={setCorpCompanyCode}
                    autoCapitalize="characters"
                  />

                  {/* Employee ID Input */}
                  <Text style={styles.modalLabel}>Employee / Staff ID *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. EMP-1042 or Staff Badge ID"
                    placeholderTextColor="#94A3B8"
                    value={corpEmployeeId}
                    onChangeText={setCorpEmployeeId}
                  />

                  {/* Department (Optional) */}
                  <Text style={styles.modalLabel}>Department (Optional)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Finance, Operations, IT, HR"
                    placeholderTextColor="#94A3B8"
                    value={corpDepartment}
                    onChangeText={setCorpDepartment}
                  />

                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setShowCorporateModal(false)}
                      disabled={corpLoading}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalSaveBtn, { backgroundColor: '#0284C7' }]}
                      onPress={handleLinkCorporateAccount}
                      disabled={corpLoading}
                    >
                      {corpLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="check-decagram" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.modalSaveText}>Verify & Link</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
`;

if (!content.includes('visible={showCorporateModal}')) {
  // Find second </Modal>
  const firstModalIdx = content.indexOf('</Modal>');
  const secondModalIdx = content.indexOf('</Modal>', firstModalIdx + 7);
  if (secondModalIdx !== -1) {
    content = content.substring(0, secondModalIdx + 8) + modalCode + content.substring(secondModalIdx + 8);
    console.log('Inserted corporate modal after second </Modal>');
  } else if (firstModalIdx !== -1) {
    content = content.substring(0, firstModalIdx + 8) + modalCode + content.substring(firstModalIdx + 8);
    console.log('Inserted corporate modal after first </Modal>');
  }
}

// 2. Insert Styles into StyleSheet.create
const stylesBlock = `
  corporateLinkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  corporateLinkIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  corporateLinkTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#065F46',
  },
  corporateLinkSubtitle: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
    fontWeight: '500',
  },
  corporateNewPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  corporateNewPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCorpSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCorpSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  modalCorpLinkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modalCorpOrgText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  modalCorpMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCorpManageBtn: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  modalCorpManageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  modalCorpUnlinkedRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCorpUnlinkedText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  modalCorpLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 7,
    borderRadius: 6,
  },
  modalCorpLinkBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  corpChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  corpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  corpChipSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  corpChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  corpChipTextSelected: {
    color: '#0284C7',
    fontWeight: '700',
  },
  corpVerifiedBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  corpVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  corpVerifiedLabel: {
    fontSize: 12,
    color: '#4B5563',
    width: 95,
  },
  corpVerifiedVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  corpUnlinkBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
  },
  corpUnlinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
`;

if (!content.includes('corporateLinkBanner:')) {
  const lastClosingBracket = content.lastIndexOf('});');
  if (lastClosingBracket !== -1) {
    content = content.substring(0, lastClosingBracket) + stylesBlock + content.substring(lastClosingBracket);
    console.log('Inserted styles before final });');
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('File successfully updated! Size:', fs.statSync(file).size);
