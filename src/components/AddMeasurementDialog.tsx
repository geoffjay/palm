/**
 * Add Measurement Dialog Component
 * Radix UI themed dialog for adding new biometric measurements
 */

import { Button, Dialog, Flex, Select, Text, TextField } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useAddMeasurement } from "../hooks/useBiometrics";
import { useBiometricStore } from "../stores/biometricStore";

export function AddMeasurementDialog() {
  const { isAddDialogOpen, closeAddDialog, measurementTypes, getSubtypesForType } = useBiometricStore();

  const { addSimpleMeasurement, addBloodPressure, isAdding } = useAddMeasurement();

  // Form state
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [_selectedSubtypeId, setSelectedSubtypeId] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [systolic, setSystolic] = useState<string>("");
  const [diastolic, setDiastolic] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [measuredAt, setMeasuredAt] = useState<string>(
    new Date()
      .toISOString()
      .slice(0, 16), // Format for datetime-local input
  );

  const selectedType = measurementTypes.find((t) => t.id.toString() === selectedTypeId);
  const _availableSubtypes = selectedType ? getSubtypesForType(selectedType.id) : [];
  const isBloodPressure = selectedType?.name === "blood_pressure";

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isAddDialogOpen) {
      setSelectedTypeId("");
      setSelectedSubtypeId("");
      setValue("");
      setSystolic("");
      setDiastolic("");
      setNotes("");
      setMeasuredAt(new Date().toISOString().slice(0, 16));
    }
  }, [isAddDialogOpen]);

  // Reset subtype when type changes
  useEffect(() => {
    setSelectedSubtypeId("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) return;

    try {
      const measurementDate = new Date(measuredAt);

      if (isBloodPressure) {
        // Blood pressure measurement
        const systolicValue = parseFloat(systolic);
        const diastolicValue = parseFloat(diastolic);

        if (Number.isNaN(systolicValue) || Number.isNaN(diastolicValue)) {
          return;
        }

        await addBloodPressure({
          systolic: systolicValue,
          diastolic: diastolicValue,
          measuredAt: measurementDate,
          notes: notes.trim() || undefined,
        });
      } else {
        // Simple measurement
        const numericValue = parseFloat(value);
        if (Number.isNaN(numericValue)) return;

        await addSimpleMeasurement(selectedType.name, numericValue, measurementDate, notes.trim() || undefined);
      }
    } catch (error) {
      // Error handling is done in the hook
      console.error("Failed to add measurement:", error);
    }
  };

  const isFormValid = () => {
    if (!selectedType) return false;

    if (isBloodPressure) {
      return (
        systolic.trim() !== "" &&
        diastolic.trim() !== "" &&
        !Number.isNaN(parseFloat(systolic)) &&
        !Number.isNaN(parseFloat(diastolic))
      );
    } else {
      return value.trim() !== "" && !Number.isNaN(parseFloat(value));
    }
  };

  return (
    <Dialog.Root open={isAddDialogOpen} onOpenChange={(open) => !open && closeAddDialog()}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Add New Measurement</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Record a new biometric measurement.
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            {/* Measurement Type */}
            <div>
              <Text as="div" size="2" mb="1" weight="bold">
                Measurement Type
              </Text>
              <Select.Root value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <Select.Trigger placeholder="Select measurement type" />
                <Select.Content>
                  {measurementTypes.map((type) => (
                    <Select.Item key={type.id} value={type.id.toString()}>
                      {type.displayName}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>

            {/* Date/Time */}
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Date & Time
              </Text>
              <input
                type="datetime-local"
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--gray-7)",
                  backgroundColor: "var(--color-background)",
                  color: "var(--gray-12)",
                }}
              />
            </label>

            {/* Value Input */}
            {selectedType &&
              (isBloodPressure ? (
                <>
                  {/* Blood Pressure Inputs */}
                  <Flex gap="3">
                    <div style={{ flex: 1 }}>
                      <Text as="div" size="2" mb="1" weight="bold">
                        Systolic ({selectedType.unit})
                      </Text>
                      <TextField.Root
                        type="number"
                        placeholder="120"
                        value={systolic}
                        onChange={(e) => setSystolic(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text as="div" size="2" mb="1" weight="bold">
                        Diastolic ({selectedType.unit})
                      </Text>
                      <TextField.Root
                        type="number"
                        placeholder="80"
                        value={diastolic}
                        onChange={(e) => setDiastolic(e.target.value)}
                      />
                    </div>
                  </Flex>
                </>
              ) : (
                <>
                  {/* Simple Value Input */}
                  <div>
                    <Text as="div" size="2" mb="1" weight="bold">
                      Value ({selectedType.unit})
                    </Text>
                    <TextField.Root
                      type="number"
                      placeholder={`Enter ${selectedType.displayName.toLowerCase()}`}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </div>
                </>
              ))}

            {/* Notes */}
            <div>
              <Text as="div" size="2" mb="1" weight="bold">
                Notes (optional)
              </Text>
              <TextField.Root
                placeholder="Add any notes about this measurement..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </Flex>

          <Flex gap="3" mt="6" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={!isFormValid() || isAdding} loading={isAdding}>
              Add Measurement
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
