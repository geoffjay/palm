/**
 * Biometrics Page Component
 * Displays biometric measurements with charts and management features
 */

import { ResponsiveLine } from "@nivo/line";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Grid, Heading, Table, Text } from "@radix-ui/themes";
import { useState } from "react";
import { useBiometrics, useBloodPressure, useHeartRate } from "../hooks/useBiometrics";
import { useBiometricStore } from "../stores/biometricStore";
import { AddMeasurementDialog } from "./AddMeasurementDialog";
import { ProtectedLayout } from "./ProtectedLayout";

export function BiometricsPage() {
  const { measurements, loading, error } = useBiometrics();
  const { openAddDialog } = useBiometricStore();

  // Pagination state for recent measurements
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (loading.measurements || loading.types) {
    return (
      <ProtectedLayout title="Biometrics">
        <Flex justify="center" align="center" height="100%">
          <Text>Loading biometric data...</Text>
        </Flex>
      </ProtectedLayout>
    );
  }

  if (error) {
    return (
      <ProtectedLayout title="Biometrics">
        <Flex justify="center" align="center" height="100%">
          <Text color="red">Error loading biometric data: {error}</Text>
        </Flex>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout title="Biometrics">
      <Flex direction="column" gap="6">
        {/* Header with Add Button */}
        <Flex justify="between" align="center">
          <div>
            <Heading size="6" mb="1">
              Biometric Measurements
            </Heading>
            <Text size="3" color="gray">
              Track and visualize your health metrics over time
            </Text>
          </div>
          <Button onClick={openAddDialog} size="3">
            <PlusIcon width="16" height="16" />
            Add Measurement
          </Button>
        </Flex>

        {/* Overview Cards */}
        <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4">
          <OverviewCard title="Total Measurements" value={measurements.length.toString()} />
          <OverviewCard
            title="Heart Rate Readings"
            value={measurements.filter((m) => m.measurementTypeId === 2).length.toString()}
          />
          <OverviewCard
            title="Blood Pressure Readings"
            value={Math.ceil(measurements.filter((m) => m.measurementTypeId === 1).length / 2).toString()}
          />
          <OverviewCard
            title="Weight Measurements"
            value={measurements.filter((m) => m.measurementTypeId === 3).length.toString()}
          />
        </Grid>

        {/* Charts Section */}
        <Grid columns={{ initial: "1", lg: "2" }} gap="6">
          <HeartRateChart />
          <BloodPressureChart />
        </Grid>

        {/* Recent Measurements */}
        <RecentMeasurements
          measurements={measurements}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </Flex>

      <AddMeasurementDialog />
    </ProtectedLayout>
  );
}

function OverviewCard({ title, value }: { title: string; value: string }) {
  return (
    <Card variant="surface">
      <Flex direction="column" p="4" align="center">
        <Text size="2" color="gray" mb="1">
          {title}
        </Text>
        <Text size="6" weight="bold">
          {value}
        </Text>
      </Flex>
    </Card>
  );
}

function HeartRateChart() {
  const { chartData } = useHeartRate();

  if (!chartData || chartData.length === 0) {
    return (
      <Card variant="surface">
        <Flex direction="column" p="6" height="300px">
          <Heading size="4" mb="4">
            Heart Rate
          </Heading>
          <Flex justify="center" align="center" flexGrow="1">
            <Text color="gray">No heart rate data available</Text>
          </Flex>
        </Flex>
      </Card>
    );
  }

  return (
    <Card variant="surface">
      <Flex direction="column" p="6" height="300px">
        <Heading size="4" mb="4">
          Heart Rate
        </Heading>
        <div style={{ height: "200px" }}>
          <ResponsiveLine
            data={chartData}
            margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
            xScale={{
              type: "time",
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
              useUTC: false,
              precision: "day",
            }}
            xFormat="time:%Y-%m-%d"
            yScale={{
              type: "linear",
              min: "auto",
              max: "auto",
              stacked: false,
            }}
            curve="cardinal"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              format: "%m/%d",
              tickValues: "every 2 days",
              legend: "Date",
              legendOffset: 36,
              legendPosition: "middle",
            }}
            axisLeft={{
              legend: "BPM",
              legendOffset: -50,
              legendPosition: "middle",
            }}
            colors={{ scheme: "category10" }}
            pointSize={6}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            enableArea={false}
            useMesh={true}
            enableSlices="x"
            animate={true}
            motionConfig="wobbly"
          />
        </div>
      </Flex>
    </Card>
  );
}

function BloodPressureChart() {
  const { chartData } = useBloodPressure();

  if (!chartData || chartData.length === 0) {
    return (
      <Card variant="surface">
        <Flex direction="column" p="6" height="300px">
          <Heading size="4" mb="4">
            Blood Pressure
          </Heading>
          <Flex justify="center" align="center" flexGrow="1">
            <Text color="gray">No blood pressure data available</Text>
          </Flex>
        </Flex>
      </Card>
    );
  }

  return (
    <Card variant="surface">
      <Flex direction="column" p="6" height="300px">
        <Heading size="4" mb="4">
          Blood Pressure
        </Heading>
        <div style={{ height: "200px" }}>
          <ResponsiveLine
            data={chartData}
            margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
            xScale={{
              type: "time",
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
              useUTC: false,
              precision: "day",
            }}
            xFormat="time:%Y-%m-%d"
            yScale={{
              type: "linear",
              min: 60,
              max: 200,
              stacked: false,
            }}
            curve="cardinal"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              format: "%m/%d",
              tickValues: "every 2 days",
              legend: "Date",
              legendOffset: 36,
              legendPosition: "middle",
            }}
            axisLeft={{
              legend: "mmHg",
              legendOffset: -50,
              legendPosition: "middle",
            }}
            colors={["#e74c3c", "#3498db"]} // Red for systolic, blue for diastolic
            pointSize={6}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            enableArea={false}
            useMesh={true}
            enableSlices="x"
            animate={true}
            motionConfig="wobbly"
            legends={[
              {
                anchor: "top-right",
                direction: "column",
                justify: false,
                translateX: 0,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: "left-to-right",
                itemWidth: 80,
                itemHeight: 20,
                symbolSize: 12,
                symbolShape: "circle",
              },
            ]}
          />
        </div>
      </Flex>
    </Card>
  );
}

interface MeasurementData {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  measurementTypeId: number;
  measurementSubtypeId: number | null;
  value: string;
  notes: string | null;
  measuredAt: Date;
  measurementType?: {
    id: number;
    name: string;
    displayName: string;
    unit: string;
  };
  measurementSubtype?: {
    id: number;
    name: string;
    displayName: string;
  };
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}

function Pagination({ currentPage, totalPages, onPageChange, totalItems }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Flex justify="between" align="center" pt="4">
      <Text size="2" color="gray">
        Showing {Math.min((currentPage - 1) * 10 + 1, totalItems)} to {Math.min(currentPage * 10, totalItems)} of{" "}
        {totalItems} measurements
      </Text>
      <Flex align="center" gap="2">
        <Button variant="outline" size="2" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronLeftIcon width="14" height="14" />
        </Button>

        {/* Page numbers */}
        <Flex gap="1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "solid" : "ghost"}
              size="2"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}
        </Flex>

        <Button
          variant="outline"
          size="2"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRightIcon width="14" height="14" />
        </Button>
      </Flex>
    </Flex>
  );
}

interface RecentMeasurementsProps {
  measurements: MeasurementData[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

function RecentMeasurements({ measurements, currentPage, itemsPerPage, onPageChange }: RecentMeasurementsProps) {
  // Sort measurements by measuredAt date (most recent first)
  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime(),
  );

  // Calculate pagination
  const totalItems = sortedMeasurements.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPageMeasurements = sortedMeasurements.slice(startIndex, startIndex + itemsPerPage);

  if (measurements.length === 0) {
    return (
      <Card variant="surface">
        <Flex direction="column" p="6">
          <Heading size="4" mb="4">
            Recent Measurements
          </Heading>
          <Text color="gray">No measurements recorded yet</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Card variant="surface">
      <Flex direction="column" p="6">
        <Flex justify="between" align="center" mb="4">
          <Heading size="4">Recent Measurements</Heading>
          <Text size="2" color="gray">
            {totalItems} total measurements
          </Text>
        </Flex>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Date & Time</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Value</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Notes</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {currentPageMeasurements.map((measurement) => (
              <Table.Row key={measurement.id}>
                <Table.Cell>
                  <Text weight="medium">
                    {measurement.measurementType?.displayName || `Type ${measurement.measurementTypeId}`}
                    {measurement.measurementSubtype && (
                      <Text size="2" color="gray" ml="1">
                        ({measurement.measurementSubtype.displayName})
                      </Text>
                    )}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Flex direction="column" gap="1">
                    <Text size="2">{new Date(measurement.measuredAt).toLocaleDateString()}</Text>
                    <Text size="2" color="gray">
                      {new Date(measurement.measuredAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Text weight="bold">
                    {measurement.value} {measurement.measurementType?.unit || ""}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" color="gray">
                    {measurement.notes || "—"}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
        />
      </Flex>
    </Card>
  );
}
