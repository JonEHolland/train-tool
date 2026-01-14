import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Select,
  Badge,
  Label,
  Heading,
  Caption,
  SegmentedControl,
  Tabs,
  TabPanel,
  Banner,
  Carousel,
  Tooltip,
  Countdown,
  CircularProgress,
  EmptyState,
  colors,
} from '../components/ui';
import type { Severity, CountdownVariant } from '../components/ui';

export function ComponentShowcase() {
  // Demo state
  const [selectedRoute, setSelectedRoute] = useState('n-line');
  const [selectedStation, setSelectedStation] = useState('everett');
  const [activeTab, setActiveTab] = useState('tab1');
  const [bannerVisible, setBannerVisible] = useState(true);

  const routeOptions = [
    { value: 'n-line', title: 'N Line', subtitle: 'Everett - Seattle' },
    { value: 's-line', title: 'S Line', subtitle: 'Seattle - Tacoma' },
  ];

  const stationOptions = [
    { value: 'everett', label: 'Everett Station' },
    { value: 'mukilteo', label: 'Mukilteo Station' },
    { value: 'edmonds', label: 'Edmonds Station' },
    { value: 'king-street', label: 'King Street Station' },
  ];

  const tabItems = [
    { id: 'tab1', label: 'Seattle', icon: '↑' },
    { id: 'tab2', label: 'Tacoma', icon: '↓' },
  ];

  const severities: Severity[] = ['danger', 'warning', 'info', 'success', 'comfortable'];

  // Countdown examples showing the generic API
  // In a real app, these values would be computed by app-specific logic
  const countdownExamples: Array<{
    text: string;
    variant: CountdownVariant;
    pulse?: boolean;
    label: string;
  }> = [
    { text: 'Departing', variant: 'danger', pulse: true, label: 'Danger + Pulse' },
    { text: '2m', variant: 'danger', label: 'Danger' },
    { text: '5m', variant: 'warning', label: 'Warning' },
    { text: '12m', variant: 'comfortable', label: 'Comfortable' },
    { text: '30m', variant: 'default', label: 'Default' },
  ];

  return (
    <div style={{ padding: 'var(--spacing-6) var(--spacing-4)', maxWidth: '800px', margin: '0 auto' }}>
      <Heading level={1} style={{ marginBottom: 'var(--spacing-6)' }}>
        Component Library
      </Heading>
      <Caption muted style={{ display: 'block', marginBottom: 'var(--spacing-8)' }}>
        Dev-only showcase page for UAT testing
      </Caption>

      {/* Typography */}
      <Section title="Typography">
        <Card>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div>
                <Label>Label Component</Label>
                <Caption style={{ display: 'block', marginTop: 4 }}>
                  Used for section headers like "SERVICE ALERTS"
                </Caption>
              </div>
              <div>
                <Heading level={1}>Heading 1</Heading>
                <Heading level={2}>Heading 2</Heading>
                <Heading level={3}>Heading 3</Heading>
                <Heading level={4}>Heading 4</Heading>
              </div>
              <div>
                <Caption>Caption - Regular secondary text</Caption>
                <br />
                <Caption muted>Caption (muted) - Tertiary text</Caption>
              </div>
            </div>
          </CardBody>
        </Card>
      </Section>

      {/* Buttons */}
      <Section title="Button">
        <Card>
          <CardBody>
            <Subsection title="Primary">
              <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                <Button variant="primary">Primary Button</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </Subsection>

            <Subsection title="Segment">
              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                <Button variant="segment">Inactive</Button>
                <Button variant="segment" active>Active</Button>
              </div>
            </Subsection>

            <Subsection title="Tab">
              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                <Button variant="tab">Inactive</Button>
                <Button variant="tab" active>Active</Button>
              </div>
            </Subsection>

            <Subsection title="Ghost & Icon">
              <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="icon">✕</Button>
                <Button variant="icon">‹</Button>
                <Button variant="icon">›</Button>
              </div>
            </Subsection>
          </CardBody>
        </Card>
      </Section>

      {/* Card */}
      <Section title="Card">
        <Card>
          <CardBody>
            <Caption>Default card with CardBody only</Caption>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Label>With Header</Label>
          </CardHeader>
          <CardBody>
            <Caption>Card with CardHeader and CardBody</Caption>
          </CardBody>
        </Card>

        <Card overflow>
          <CardBody>
            <Caption>Card with overflow=true (for dropdowns, tabs that extend beyond bounds)</Caption>
          </CardBody>
        </Card>
      </Section>

      {/* Select */}
      <Section title="Select">
        <Select
          label="Your Station"
          options={stationOptions}
          value={selectedStation}
          onChange={setSelectedStation}
        />
      </Section>

      {/* Badge */}
      <Section title="Badge">
        <Card>
          <CardBody>
            <Subsection title="Text Badges">
              <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                {severities.map((severity) => (
                  <Badge key={severity} severity={severity}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Badge>
                ))}
              </div>
            </Subsection>

            <Subsection title="Small Badges">
              <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                {severities.map((severity) => (
                  <Badge key={severity} severity={severity} size="sm">
                    {severity}
                  </Badge>
                ))}
              </div>
            </Subsection>

            <Subsection title="Dot Badges">
              <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
                {severities.map((severity) => (
                  <div key={severity} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <Badge severity={severity} dot />
                    <Caption>{severity}</Caption>
                  </div>
                ))}
              </div>
            </Subsection>
          </CardBody>
        </Card>
      </Section>

      {/* SegmentedControl */}
      <Section title="SegmentedControl">
        <SegmentedControl
          options={routeOptions}
          value={selectedRoute}
          onChange={setSelectedRoute}
        />
        <Caption>Selected: {selectedRoute}</Caption>
      </Section>

      {/* Tabs */}
      <Section title="Tabs">
        <Card overflow>
          <Tabs tabs={tabItems} activeTab={activeTab} onTabChange={setActiveTab} />
          <CardBody>
            <TabPanel id="tab1" active={activeTab === 'tab1'}>
              <Caption>Seattle tab content</Caption>
            </TabPanel>
            <TabPanel id="tab2" active={activeTab === 'tab2'}>
              <Caption>Tacoma tab content</Caption>
            </TabPanel>
          </CardBody>
        </Card>
      </Section>

      {/* Banner */}
      <Section title="Banner">
        <Banner
          icon="⚡"
          title="Update Available"
          subtitle="New features ready to install"
          visible={bannerVisible}
          onDismiss={() => setBannerVisible(false)}
          actions={<Button variant="primary">Update Now</Button>}
        />
        {!bannerVisible && (
          <Button variant="ghost" onClick={() => setBannerVisible(true)}>
            Show Banner
          </Button>
        )}
      </Section>

      {/* Carousel */}
      <Section title="Carousel">
        <Card>
          <CardBody>
            <Carousel>
              <div style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                <Heading level={3}>Slide 1</Heading>
                <Caption>First carousel item</Caption>
              </div>
              <div style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                <Heading level={3}>Slide 2</Heading>
                <Caption>Second carousel item</Caption>
              </div>
              <div style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
                <Heading level={3}>Slide 3</Heading>
                <Caption>Third carousel item</Caption>
              </div>
            </Carousel>
          </CardBody>
        </Card>
      </Section>

      {/* Tooltip */}
      <Section title="Tooltip">
        <Card>
          <CardBody>
            <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap' }}>
              <Tooltip content="Top tooltip" position="top">
                <Button variant="ghost">Hover (Top)</Button>
              </Tooltip>
              <Tooltip content="Bottom tooltip" position="bottom">
                <Button variant="ghost">Hover (Bottom)</Button>
              </Tooltip>
              <Tooltip content="Left tooltip" position="left">
                <Button variant="ghost">Hover (Left)</Button>
              </Tooltip>
              <Tooltip content="Right tooltip" position="right">
                <Button variant="ghost">Hover (Right)</Button>
              </Tooltip>
            </div>
          </CardBody>
        </Card>
      </Section>

      {/* Countdown */}
      <Section title="Countdown">
        <Card>
          <CardBody>
            <Subsection title="Large Display (Hero)">
              <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap', alignItems: 'center' }}>
                {countdownExamples.map((example, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <Countdown variant={example.variant} large pulse={example.pulse}>
                      {example.text}
                    </Countdown>
                    <Caption style={{ display: 'block', marginTop: 4 }}>{example.label}</Caption>
                  </div>
                ))}
              </div>
            </Subsection>

            <Subsection title="Inline Display">
              <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                {countdownExamples.map((example, i) => (
                  <Countdown key={i} variant={example.variant} pulse={example.pulse}>
                    in {example.text}
                  </Countdown>
                ))}
              </div>
            </Subsection>

            <Caption muted style={{ display: 'block', marginTop: 'var(--spacing-4)' }}>
              Note: The Countdown component is a pure presentational component.
              App-specific logic (urgency thresholds, text formatting) lives in the app layer.
            </Caption>
          </CardBody>
        </Card>
      </Section>

      {/* CircularProgress */}
      <Section title="CircularProgress">
        <Card>
          <CardBody>
            <div style={{ display: 'flex', gap: 'var(--spacing-8)', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { progress: 1, color: colors.accent.primary, text: '60m' },
                { progress: 0.5, color: colors.accent.primary, text: '30m' },
                { progress: 0.17, color: colors.status.comfortable, text: '10m' },
                { progress: 0.05, color: colors.status.warning, text: '3m' },
                { progress: 0.02, color: colors.status.danger, text: '1m' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <CircularProgress
                    progress={item.progress}
                    color={item.color}
                    size={120}
                  >
                    <Countdown variant={item.progress <= 0.05 ? (item.progress <= 0.02 ? 'danger' : 'warning') : item.progress <= 0.17 ? 'comfortable' : 'default'} large>
                      {item.text}
                    </Countdown>
                  </CircularProgress>
                  <Caption style={{ display: 'block', marginTop: 'var(--spacing-2)' }}>
                    {Math.round(item.progress * 100)}% progress
                  </Caption>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </Section>

      {/* EmptyState */}
      <Section title="EmptyState">
        <Card>
          <CardBody>
            <EmptyState
              title="No trains available"
              subtitle="Check back later for upcoming departures"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <EmptyState
              icon="🚆"
              title="No trains on weekends"
              subtitle="Service resumes Monday morning"
            />
          </CardBody>
        </Card>
      </Section>

      {/* Color Palette */}
      <Section title="Color Palette">
        <Card>
          <CardBody>
            <Subsection title="Background Colors">
              <ColorSwatch label="bg.primary" color={colors.bg.primary} />
              <ColorSwatch label="bg.secondary" color={colors.bg.secondary} />
              <ColorSwatch label="bg.tertiary" color={colors.bg.tertiary} />
            </Subsection>

            <Subsection title="Accent Colors">
              <ColorSwatch label="accent.primary" color={colors.accent.primary} />
              <ColorSwatch label="accent.secondary" color={colors.accent.secondary} />
              <ColorSwatch label="accent.tertiary" color={colors.accent.tertiary} />
            </Subsection>

            <Subsection title="Status Colors">
              <ColorSwatch label="status.danger" color={colors.status.danger} />
              <ColorSwatch label="status.warning" color={colors.status.warning} />
              <ColorSwatch label="status.comfortable" color={colors.status.comfortable} />
              <ColorSwatch label="status.info" color={colors.status.info} />
              <ColorSwatch label="status.success" color={colors.status.success} />
            </Subsection>
          </CardBody>
        </Card>
      </Section>
    </div>
  );
}

// Helper components for the showcase
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--spacing-8)' }}>
      <Heading level={2} style={{ marginBottom: 'var(--spacing-4)' }}>
        {title}
      </Heading>
      {children}
    </div>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--spacing-4)' }}>
      <Caption muted style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>
        {title}
      </Caption>
      {children}
    </div>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', marginRight: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)' }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 'var(--radius-md)',
          background: color,
          border: '1px solid var(--color-surface-glass-border)',
        }}
      />
      <Caption>{label}</Caption>
    </div>
  );
}
