from pathlib import Path
import re
for name in ('MainWindow','LandscapeWindow'):
    p=Path(name+'.xaml'); s=p.read_text(encoding='utf-8-sig')
    start=s.index('<Border x:Name="PaperCompartmentCard"')
    opening=s.index('>',start)+1
    depth=1
    for m in re.finditer(r'</?Border\b[^>]*>',s[opening:]):
        token=m.group()
        if token.startswith('</'): depth-=1
        elif not token.endswith('/>'): depth+=1
        if depth==0:
            end=opening+m.start();break
    large=name=='MainWindow'
    s=s[:opening]+f'''
                                <Grid>
                                    <Grid.RowDefinitions>
                                        <RowDefinition Height="Auto"/>
                                        <RowDefinition Height="*"/>
                                        <RowDefinition Height="Auto"/>
                                        <RowDefinition Height="Auto"/>
                                    </Grid.RowDefinitions>
                                    <TextBlock Grid.Row="0" Text="PAPER" FontSize="{12.5 if large else 10}" FontWeight="Black" Foreground="#B45309" HorizontalAlignment="Center" Margin="0,0,0,4"/>
                                    <StackPanel Grid.Row="1" HorizontalAlignment="Center" VerticalAlignment="Center" Margin="0,4">
                                        <TextBlock Text="WEIGHT" FontSize="{10 if large else 8.5}" FontWeight="Bold" Foreground="#B45309" HorizontalAlignment="Center"/>
                                        <StackPanel Orientation="Horizontal" HorizontalAlignment="Center">
                                            <TextBlock x:Name="PaperWeightText" Text="0.000" FontSize="{24 if large else 16}" FontWeight="Black" Foreground="#B45309"/>
                                            <TextBlock Text=" kg" FontSize="{12 if large else 10}" Foreground="#B45309" VerticalAlignment="Bottom" Margin="0,0,0,2"/>
                                        </StackPanel>
                                    </StackPanel>
                                    <Border Grid.Row="2" Background="#FEF3C7" BorderBrush="#FDE68A" BorderThickness="1" CornerRadius="4" Padding="4,3" HorizontalAlignment="Center">
                                        <StackPanel Orientation="Horizontal">
                                            <TextBlock Text="TOTAL: " FontSize="{10 if large else 8.5}" FontWeight="Bold" Foreground="#B45309" VerticalAlignment="Center"/>
                                            <TextBlock x:Name="PaperTotalWeightText" Text="0.000" FontSize="{20 if large else 14}" FontWeight="Black" Foreground="#B45309"/>
                                            <TextBlock Text=" kg" FontSize="{12 if large else 10}" Foreground="#B45309" VerticalAlignment="Center"/>
                                        </StackPanel>
                                    </Border>
                                    <TextBlock x:Name="PaperCompartmentStatus" Grid.Row="3" TextWrapping="Wrap" TextAlignment="Center" FontSize="10" FontWeight="Bold" Margin="0,4,0,0" Visibility="Collapsed"/>
                                </Grid>
                            '''+s[end:]
    s=s.replace('UBC','PAPER').replace('Used Beverage Carton / Can','Paper weight')
    p.write_text(s,encoding='utf-8')
    p=Path(name+'.xaml.cs');s=p.read_text(encoding='utf-8-sig')
    s=s.replace('    private string? activeScanCompartment;','    private string? activeScanCompartment;\n    private double paperTotalWeightKg;')
    needle='''        if (!compartmentAvailability.TryApply(message)) return false;
        CompartmentStatusPresenter'''
    s=s.replace(needle,'''        if (!compartmentAvailability.TryApply(message)) return false;
        RefreshCompartmentCards();
        return true;
    }

    private void RefreshCompartmentCards()
    {
        CompartmentStatusPresenter''',1)
    pos=s.index('    private void RefreshCompartmentCards()');end=s.index('    private readonly DispatcherTimer',pos)
    part=s[pos:end].replace('        return true;\n','')
    s=s[:pos]+part+s[end:]
    s=s.replace('        InitializeComponent();','        InitializeComponent();\n        RefreshCompartmentCards();',1)
    s=s.replace('    private void ConnectArduino()\n    {','''    private void ConnectArduino()
    {
        compartmentAvailability.ResetConnection();
        RefreshCompartmentCards();''',1)
    # Connection loss must not leave the previous healthy appearance active.
    pos=s.index('    private void Serial_ErrorReceived(');end=s.index('    private void ProcessArduinoMessage',pos)
    part=s[pos:end].replace('            ConnectionText.Text', '            compartmentAvailability.ResetConnection();\n            RefreshCompartmentCards();\n            ConnectionText.Text',1)
    s=s[:pos]+part+s[end:]
    s=s.replace('    public void StartMachine(bool forceSimulator = false)\n    {','''    public void StartMachine(bool forceSimulator = false)
    {
        if (!serial.IsConnected && (IsDemoMode || forceSimulator))
        {
            foreach (string compartment in new[] { "PLASTIC", "METAL", "PAPER" })
                ProcessCompartmentStatus($"COMPARTMENT:{compartment};WORKING:OK;BIN:CLEAR");
        }''',1)
    s=s.replace('IncrementMaterialSizeCounter(result.Material, result.Size);','IncrementMaterialSizeCounter(result.Material, result.Size, result.WeightKg);')
    s=s.replace('private void IncrementMaterialSizeCounter(string material, string size)','private void IncrementMaterialSizeCounter(string material, string size, double weightKg)')
    s=s.replace('            TetraPakSmallCountText.Text = TetraPakMediumCountText.Text = TetraPakLargeCountText.Text = RejectedCountText.Text =','            RejectedCountText.Text =')
    s=s.replace('PlasticTotalCountText.Text = CanTotalCountText.Text = TetraPakTotalCountText.Text = RejectedTotalCountText.Text','PlasticTotalCountText.Text = CanTotalCountText.Text = RejectedTotalCountText.Text')
    pos=s.index('    public void ResetSession()');end=s.index('    private void IncrementMaterialSizeCounter',pos)
    part=s[pos:end].replace('        TotalPointsText.Text = "0";','        TotalPointsText.Text = "0";\n        paperTotalWeightKg = 0;\n        PaperWeightText.Text = PaperTotalWeightText.Text = "0.000";')
    s=s[:pos]+part+s[end:]
    s=s.replace('if (size == "SMALL") TetraPakSmallCountText.Text = (++tetraPakSmallCount).ToString();','if (size == "SMALL") tetraPakSmallCount++;')
    s=s.replace('else if (size == "MEDIUM") TetraPakMediumCountText.Text = (++tetraPakMediumCount).ToString();','else if (size == "MEDIUM") tetraPakMediumCount++;')
    s=s.replace('else if (size == "LARGE") TetraPakLargeCountText.Text = (++tetraPakLargeCount).ToString();','else if (size == "LARGE") tetraPakLargeCount++;')
    s=s.replace('            TetraPakTotalCountText.Text = (tetraPakSmallCount + tetraPakMediumCount + tetraPakLargeCount).ToString();','''            double acceptedWeight = double.IsFinite(weightKg) && weightKg > 0 ? weightKg : 0;
            paperTotalWeightKg += acceptedWeight;
            PaperWeightText.Text = acceptedWeight.ToString("0.000");
            PaperTotalWeightText.Text = paperTotalWeightKg.ToString("0.000");''')
    s=s.replace('Insert Bottle/Can/UBC/Cup','Insert Bottle/Can/Paper/Cup')
    p.write_text(s,encoding='utf-8')
