import { BadRequestException } from '@nestjs/common';

import { compositeTypeDefintions } from 'src/engine/metadata-modules/field-metadata/composite-types';
import { FieldMetadataType } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { isCompositeFieldMetadataType } from 'src/engine/metadata-modules/field-metadata/utils/is-composite-field-metadata-type.util';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { computeObjectTargetTable } from 'src/engine/utils/compute-object-target-table.util';

export const getFieldType = (
  objectMetadata: ObjectMetadataEntity,
  fieldName: string,
): FieldMetadataType | undefined => {
  for (const fieldMetdata of objectMetadata.fields) {
    if (fieldName === fieldMetdata.name) {
      return fieldMetdata.type;
    }
  }
};

export const checkFields = (
  objectMetadata: ObjectMetadataEntity,
  fieldNames: string[],
): void => {
  const fieldMetadataNames = objectMetadata.fields
    .map((field) => {
      if (isCompositeFieldMetadataType(field.type)) {
        const compositeType = compositeTypeDefintions.get(field.type);

        if (!compositeType) {
          throw new BadRequestException(
            `Composite type '${field.type}' not found`,
          );
        }

        // TODO: Don't really know why we need to put fieldName and compositeType name here
        return [
          field.name,
          compositeType.properties.map(
            (compositeProperty) => compositeProperty.name,
          ),
        ].flat();
      }

      return field.name;
    })
    .flat();

  for (const fieldName of fieldNames) {
    if (!fieldMetadataNames.includes(fieldName)) {
      throw new BadRequestException(
        `field '${fieldName}' does not exist in '${computeObjectTargetTable(
          objectMetadata,
        )}' object`,
      );
    }
  }
};
