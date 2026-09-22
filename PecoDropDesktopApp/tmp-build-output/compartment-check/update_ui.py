from pathlib import Path
import re
for name in ('MainWindow', 'LandscapeWindow'):
    p=Path(name+'.xaml')
    s=p.read_text(encoding='utf-8-sig')
    # Add a persistent alert row separate from the transient USB connection error.
    at=s.index('x:Name="HardwareErrorBanner"')
    defs=s.rfind('</Grid.RowDefinitions>',0,at)
    s=s[:defs]+'    <RowDefinition Height="Auto"/>\n'+s[defs:]
    at=s.index('<Border x:Name="HardwareErrorBanner"')
    s=s[:at]+'''<Border x:Name="CompartmentWarningBanner" Grid.Row="3" Margin="0,4,0,0" Background="#FEF2F2" BorderBrush="#FECACA" BorderThickness="1" CornerRadius="5" Padding="8,4" Visibility="Collapsed">
                                <TextBlock x:Name="CompartmentWarningText" TextWrapping="Wrap" FontSize="11" FontWeight="Bold" Foreground="#B91C1C"/>
                            </Border>
                            '''+s[at:]
    for prefix,color in [('Plastic','#F0FDFA'),('Metal','#F0F9FF'),('Paper','#FFFBEB')]:
        # Locate each material card by its counter and closest outer Border before the Grid.
        counter={'Plastic':'PlasticSmallCountText','Metal':'CanSmallCountText','Paper':'TetraPakSmallCountText'}[prefix]
        pos=s.index('x:Name="'+counter+'"')
        grid=s.rfind('<Grid>',0,pos)
        border=s.rfind('<Border ',0,grid)
        s=s[:border]+s[border:].replace('<Border ',f'<Border x:Name="{prefix}CompartmentCard" ',1)
        # Append a fourth row for the card's persistent reason.
        pos=s.index('x:Name="'+prefix+'CompartmentCard"')
        defs=s.index('</Grid.RowDefinitions>',pos)
        s=s[:defs]+'    <RowDefinition Height="Auto"/>\n'+s[defs:]
        defs=s.index('</Grid.RowDefinitions>',pos)+len('</Grid.RowDefinitions>')
        s=s[:defs]+f'\n<TextBlock x:Name="{prefix}CompartmentStatus" Grid.Row="3" TextWrapping="Wrap" TextAlignment="Center" FontSize="10" FontWeight="Bold" Foreground="#B91C1C" Margin="0,4,0,0" Visibility="Collapsed"/>'+s[defs:]
    p.write_text(s,encoding='utf-8')
    p=Path(name+'.xaml.cs');s=p.read_text(encoding='utf-8-sig')
    s=s.replace('    private readonly SerialManager serial = new();','''    private readonly SerialManager serial = new();
    private readonly CompartmentAvailability compartmentAvailability = new();
    private string? activeScanCompartment;

    private bool ProcessCompartmentStatus(string message)
    {
        if (!compartmentAvailability.TryApply(message)) return false;
        CompartmentStatusPresenter.UpdateCard(PlasticCompartmentCard, PlasticCompartmentStatus, compartmentAvailability["PLASTIC"], "PLASTIC");
        CompartmentStatusPresenter.UpdateCard(MetalCompartmentCard, MetalCompartmentStatus, compartmentAvailability["METAL"], "METAL");
        CompartmentStatusPresenter.UpdateCard(PaperCompartmentCard, PaperCompartmentStatus, compartmentAvailability["PAPER"], "PAPER");
        CompartmentWarningText.Text = compartmentAvailability.WarningText;
        CompartmentWarningBanner.Visibility = CompartmentWarningText.Text.Length == 0 ? Visibility.Collapsed : Visibility.Visible;
        if (pendingBottleResult is not null && !compartmentAvailability.CanAccept(pendingBottleResult.Material))
        {
            pendingBottleResult = null;
            pendingBottlePoints = 0;
        }
        if (activeScanCompartment is not null && !compartmentAvailability.CanAccept(activeScanCompartment))
        {
            scanTimer.Stop();
            activeScanCompartment = null;
        }
        return true;
    }
''',1)
    s=s.replace('        LogTelemetry($"[RX] {message}");','''        LogTelemetry($"[RX] {message}");
        if (ProcessCompartmentStatus(message)) return;
        // Compartment diagnostics do not reject an item or stop healthy intakes.
        if (message.StartsWith("FAULT:", StringComparison.OrdinalIgnoreCase)) return;''',1)
    needle='''        {
            StatusText.Text = "Scanning...";'''
    s=s.replace(needle,'''        {
            activeScanCompartment = CompartmentAvailability.CompartmentFor(message.Split(':')[0]);
            if (activeScanCompartment is not null && !compartmentAvailability.CanAccept(activeScanCompartment)) return;
            pendingBottleResult = null;
            pendingBottlePoints = 0;
            StatusText.Text = "Scanning...";''',1)
    s=s.replace('''        if (message == "BOTTLE:CLEARED")
        {
            CommitPendingBottle();''','''        if (message == "BOTTLE:CLEARED" || message.StartsWith("BOTTLE:CLEARED;COMPARTMENT:", StringComparison.OrdinalIgnoreCase))
        {
            if (message.Contains(';') && pendingBottleResult is not null &&
                !string.Equals(message.Split(';')[1]["COMPARTMENT:".Length..],
                    CompartmentAvailability.CompartmentFor(pendingBottleResult.Material), StringComparison.OrdinalIgnoreCase)) return;
            activeScanCompartment = null;
            CommitPendingBottle();''',1)
    s=s.replace('''        BottleResult result = ParseBottleResult(message);

        if (!machineStarted)''','''        BottleResult result = ParseBottleResult(message);

        if (!compartmentAvailability.CanAccept(result.Material))
        {
            pendingBottleResult = null;
            pendingBottlePoints = 0;
            return;
        }
        if (!machineStarted)''',1)
    s=s.replace('''        BottleResult result = pendingBottleResult;
        int points''','''        if (!compartmentAvailability.CanAccept(pendingBottleResult.Material))
        {
            pendingBottleResult = null;
            pendingBottlePoints = 0;
            return;
        }
        BottleResult result = pendingBottleResult;
        int points''',1)
    s=s.replace('''        string sizeUpper = (size ?? "MEDIUM").Trim().ToUpperInvariant();''','''        string sizeUpper = (size ?? "MEDIUM").Trim().ToUpperInvariant();
        if (!compartmentAvailability.CanAccept(matUpper)) return;''',1)
    # Detailed diagnostics are logged; authoritative compartment snapshots drive UI availability.
    s=s.replace('''    private void ProcessArduinoError(string message)
    {''','''    private void ProcessArduinoError(string message)
    {
        if (message.StartsWith("ERROR:PLASTIC_", StringComparison.OrdinalIgnoreCase) ||
            message.StartsWith("ERROR:METAL_", StringComparison.OrdinalIgnoreCase) ||
            message.StartsWith("ERROR:PAPER_", StringComparison.OrdinalIgnoreCase) ||
            message.StartsWith("ERROR:HX711_", StringComparison.OrdinalIgnoreCase) ||
            message.StartsWith("ERROR:UNSTABLE_CALIBRATION_", StringComparison.OrdinalIgnoreCase) ||
            message == "ERROR:COMPARTMENT_BUSY") return;''',1)
    p.write_text(s,encoding='utf-8')
