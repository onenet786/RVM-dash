const fs = require('fs');

let code = fs.readFileSync('mobile_app/screens/DashboardScreen.jsx', 'utf8');

// 1. State updates
const oldState = `  // Corporate Workplace & Employee ID State
  const [showCorporateModal, setShowCorporateModal] = useState(false);
  const [corpCompanyCode, setCorpCompanyCode] = useState('');
  const [corpEmployeeId, setCorpEmployeeId] = useState('');
  const [corpDepartment, setCorpDepartment] = useState('');
  const [corpLoading, setCorpLoading] = useState(false);
  const [availableOrgs, setAvailableOrgs] = useState([
    { org_id: 'ORG_ALLIED@ALLIED_5092', name: 'Allied Bank Pvt Ltd', code: 'ALLIED' },
    { org_id: 'ORG_UCP', name: 'University of Central Punjab', code: 'UCP' },
    { org_id: 'ORG_ZONG@ZONG_9961', name: 'ZONG PAKISTAN', code: 'ZONG' }
  ]);`;

const newState = `  // Corporate Workplace & Employee ID State
  const [showCorporateModal, setShowCorporateModal] = useState(false);
  const [corpCompanyCode, setCorpCompanyCode] = useState('');
  const [corpEmployeeId, setCorpEmployeeId] = useState('');
  const [corpDepartment, setCorpDepartment] = useState('');
  const [corpLoading, setCorpLoading] = useState(false);
  const [corpErrorMsg, setCorpErrorMsg] = useState('');
  const [corpDepts, setCorpDepts] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [availableOrgs, setAvailableOrgs] = useState([
    { org_id: 'ORG_ALFALAH', name: 'Bank Alfalah Limited', code: 'ALFALAH', domain: 'bankalfalah.com' },
    { org_id: 'ORG_ENGRO', name: 'Engro Corporation', code: 'ENGRO', domain: 'engro.com' },
    { org_id: 'ORG_UCP', name: 'University of Central Punjab', code: 'UCP', domain: 'ucp.edu.pk' },
    { org_id: 'ORG_METRO', name: 'Metro Cash & Carry', code: 'METRO', domain: 'metro.pk' }
  ]);

  const fetchCorporateOrgs = useCallback(async () => {
    try {
      const res = await axios.get(\`\${API_BASE_URL}/corporate/organizations\`, { timeout: 8000 });
      if (res.data?.success && Array.isArray(res.data.organizations) && res.data.organizations.length > 0) {
        setAvailableOrgs(res.data.organizations.map(o => ({
          org_id: o.org_id,
          name: o.name,
          code: o.company_code || o.org_id.replace('ORG_', ''),
          domain: o.domain
        })));
      }
    } catch (e) {
      console.log('Fetch corporate orgs note:', e.message);
    }
  }, []);

  const fetchOrgDepartments = async (orgIdOrCode) => {
    if (!orgIdOrCode) return;
    setLoadingDepts(true);
    try {
      const res = await axios.get(\`\${API_BASE_URL}/corporate/departments/\${orgIdOrCode}\`, { timeout: 8000 });
      if (res.data?.success && Array.isArray(res.data.departments)) {
        setCorpDepts(res.data.departments);
      }
    } catch (e) {
      console.log('Fetch org departments note:', e.message);
    } finally {
      setLoadingDepts(false);
    }
  };

  const selectPartnerOrg = (org) => {
    const code = org.code || org.org_id.replace('ORG_', '');
    setCorpCompanyCode(code);
    setCorpDepartment('');
    setCorpErrorMsg('');
    fetchOrgDepartments(org.org_id);
  };

  useEffect(() => {
    fetchCorporateOrgs();
  }, [fetchCorporateOrgs]);`;

// 2. Action handler updates
const oldHandler = `  const handleLinkCorporateAccount = async () => {
    const cleanCode = corpCompanyCode.trim();
    if (!cleanCode) {
      Alert.alert('Company Code Required', 'Please enter your Company Code (e.g., ENGRO, ALFALAH, UCP, METRO) or tap a partner button.');
      return;
    }

    const userId = localUser?.id || localUser?.userId || localUser?.email || localUser?.mobile || localUser?.username;
    if (!userId) {
      Alert.alert('Session Required', 'Please log in again to link your corporate account.');
      return;
    }

    setCorpLoading(true);
    try {
      const res = await axios.post(\`\${API_BASE_URL}/user/link-corporate\`, {
        userId,
        companyCode: cleanCode,
        employeeId: corpEmployeeId.trim(),
        department: corpDepartment.trim()
      }, { timeout: 12000 });

      if (res.data?.success && res.data?.user) {
        const mergedUser = {
          ...localUser,
          ...res.data.user,
          userType: 'ENTERPRISE',
          orgId: res.data.user.orgId,
          orgName: res.data.user.orgName,
          department: res.data.user.department,
          employeeId: res.data.user.employeeId
        };
        setLocalUser(mergedUser);
        await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
        setShowCorporateModal(false);
        setCorpCompanyCode('');
        setCorpEmployeeId('');
        setCorpDepartment('');
        if (Platform.OS === 'android') {
          ToastAndroid.show(\`🎉 Verified! Linked to \${res.data.user.orgName}\`, ToastAndroid.LONG);
        } else {
          Alert.alert('Corporate Verified', res.data.message || 'Corporate account linked successfully!');
        }
      } else {
        Alert.alert('Corporate Link Notice', res.data?.message || 'Could not verify company code.');
      }
    } catch (err) {
      console.warn('Link corporate error:', err);
      Alert.alert('Verification Notice', err.response?.data?.message || err.message || 'Could not link corporate account.');
    } finally {
      setCorpLoading(false);
    }
  };`;

const newHandler = `  const handleLinkCorporateAccount = async () => {
    const cleanCode = corpCompanyCode.trim();
    if (!cleanCode) {
      setCorpErrorMsg('Please select a partner company or enter a Company Code.');
      Alert.alert('Company Code Required', 'Please enter your Company Code (e.g., ALFALAH, ENGRO, UCP, METRO) or tap a partner button.');
      return;
    }

    const cleanEmpId = corpEmployeeId.trim();
    if (!cleanEmpId) {
      setCorpErrorMsg('Official Staff ID is strictly required to verify against the employee roster.');
      Alert.alert('Staff ID Required', 'Please enter your official Company Staff / Employee ID to verify your corporate membership.');
      return;
    }

    const userId = localUser?.id || localUser?.userId || localUser?.email || localUser?.mobile || localUser?.username;
    if (!userId) {
      Alert.alert('Session Required', 'Please log in again to link your corporate account.');
      return;
    }

    setCorpLoading(true);
    setCorpErrorMsg('');
    try {
      const res = await axios.post(\`\${API_BASE_URL}/user/link-corporate\`, {
        userId,
        companyCode: cleanCode,
        employeeId: cleanEmpId,
        department: corpDepartment.trim()
      }, { timeout: 12000 });

      if (res.data?.success && res.data?.user) {
        const mergedUser = {
          ...localUser,
          ...res.data.user,
          userType: 'ENTERPRISE',
          orgId: res.data.user.orgId,
          orgName: res.data.user.orgName,
          department: res.data.user.department,
          employeeId: res.data.user.employeeId
        };
        setLocalUser(mergedUser);
        await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
        setShowCorporateModal(false);
        setCorpCompanyCode('');
        setCorpEmployeeId('');
        setCorpDepartment('');
        setCorpErrorMsg('');
        if (Platform.OS === 'android') {
          ToastAndroid.show(\`🎉 Verified! Linked to \${res.data.user.orgName}\`, ToastAndroid.LONG);
        } else {
          Alert.alert('Corporate Verified', res.data.message || 'Corporate account linked successfully!');
        }
      } else {
        const msg = res.data?.message || 'Could not verify company code.';
        setCorpErrorMsg(msg);
        Alert.alert('Corporate Link Notice', msg);
      }
    } catch (err) {
      console.warn('Link corporate error:', err);
      const msg = err.response?.data?.message || err.message || 'Could not verify corporate account.';
      setCorpErrorMsg(msg);
      Alert.alert('Verification Rejected', msg);
    } finally {
      setCorpLoading(false);
    }
  };`;

// 3. Modal JSX updates
const oldModalView = `                  {/* Partner Quick-Select Chips */}
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
                    placeholder="e.g. ALLIED, UCP, ZONG or ucp.edu.pk"
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
                  />`;

const newModalView = `                  {/* Error Notification Alert */}
                  {Boolean(corpErrorMsg) && (
                    <View style={styles.corpAlertError}>
                      <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                      <Text style={styles.corpAlertErrorText}>{corpErrorMsg}</Text>
                    </View>
                  )}

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
                          onPress={() => selectPartnerOrg(org)}
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
                    placeholder="e.g. ALFALAH, ENGRO, UCP, METRO"
                    placeholderTextColor="#94A3B8"
                    value={corpCompanyCode}
                    onChangeText={(val) => {
                      setCorpCompanyCode(val);
                      setCorpErrorMsg('');
                      fetchOrgDepartments(val);
                    }}
                    autoCapitalize="characters"
                  />

                  {/* Employee ID Input */}
                  <Text style={styles.modalLabel}>Employee / Staff ID * (Required)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. BA-1001, ENG-201, UCP-501, MET-301"
                    placeholderTextColor="#94A3B8"
                    value={corpEmployeeId}
                    onChangeText={(val) => {
                      setCorpEmployeeId(val);
                      setCorpErrorMsg('');
                    }}
                    autoCapitalize="characters"
                  />
                  <Text style={{ fontSize: 10, color: '#64748B', marginTop: 3 }}>
                    🔒 Staff ID is strictly verified against your company's authorized HR employee roster.
                  </Text>

                  {/* Selectable Official Department Chips */}
                  {corpDepts.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.modalLabel}>Official Departments ({corpDepts.length}):</Text>
                      <View style={styles.corpChipGrid}>
                        {corpDepts.map(d => {
                          const isDeptSelected = corpDepartment === d.name;
                          return (
                            <TouchableOpacity
                              key={d.dept_id}
                              style={[styles.corpDeptChip, isDeptSelected && styles.corpDeptChipSelected]}
                              onPress={() => setCorpDepartment(d.name)}
                            >
                              <Text style={[styles.corpDeptChipText, isDeptSelected && styles.corpDeptChipTextSelected]}>
                                {d.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Department Custom / Fallback Input */}
                  <Text style={styles.modalLabel}>Selected Department</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Choose from departments above or type official name"
                    placeholderTextColor="#94A3B8"
                    value={corpDepartment}
                    onChangeText={setCorpDepartment}
                  />`;

// 4. Styles updates
const oldStylesEnd = `  corpUnlinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
});`;

const newStylesEnd = `  corpUnlinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  corpAlertError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  corpAlertErrorText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
  },
  corpDeptChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  corpDeptChipSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  corpDeptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  corpDeptChipTextSelected: {
    color: '#047857',
    fontWeight: '700',
  },
});`;

const normalize = s => s.replace(/\r\n/g, '\n');

let normCode = normalize(code);
let count = 0;

if (normCode.includes(normalize(oldState))) {
  normCode = normCode.replace(normalize(oldState), normalize(newState));
  console.log('1. Patched state in DashboardScreen.jsx');
  count++;
} else {
  console.warn('Could not find oldState');
}

if (normCode.includes(normalize(oldHandler))) {
  normCode = normCode.replace(normalize(oldHandler), normalize(newHandler));
  console.log('2. Patched handler in DashboardScreen.jsx');
  count++;
} else {
  console.warn('Could not find oldHandler');
}

if (normCode.includes(normalize(oldModalView))) {
  normCode = normCode.replace(normalize(oldModalView), normalize(newModalView));
  console.log('3. Patched modal view in DashboardScreen.jsx');
  count++;
} else {
  console.warn('Could not find oldModalView');
}

if (normCode.includes(normalize(oldStylesEnd))) {
  normCode = normCode.replace(normalize(oldStylesEnd), normalize(newStylesEnd));
  console.log('4. Patched styles in DashboardScreen.jsx');
  count++;
} else {
  console.warn('Could not find oldStylesEnd');
}

if (count > 0) {
  fs.writeFileSync('mobile_app/screens/DashboardScreen.jsx', normCode, 'utf8');
  console.log(`Saved mobile_app/screens/DashboardScreen.jsx with ${count} patches applied.`);
}
