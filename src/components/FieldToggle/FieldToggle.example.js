import React from 'react';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { Button } from '../../components';
import FieldToggle from './FieldToggle';

const formName = 'Styleguide.FieldToggle.Form';

const FormComponent = (props) => (
  <FinalForm
    {...props}
    formId={formName}
    render={(fieldRenderProps) => {
      const { form, handleSubmit, onChange, invalid, pristine, submitting } =
        fieldRenderProps;

      const submitDisabled = invalid || pristine || submitting;

      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
        >
          <FormSpy
            onChange={onChange}
            subscription={{ values: true, dirty: true }}
          />
          <FieldToggle
            id="toggle-id1"
            name="toggle-option"
            label="Enable notifications"
          />
          <FieldToggle
            id="toggle-id2"
            name="toggle-success"
            label="Success toggle"
            useSuccessColor
          />

          <Button
            style={{ marginTop: 24 }}
            type="submit"
            disabled={submitDisabled}
          >
            Submit
          </Button>
        </form>
      );
    }}
  />
);

export const FieldToggleExample = {
  component: FormComponent,
  props: {
    onSubmit: (values) => {
      console.log('FieldToggle form submitted with values:', values);
    },
  },
  group: 'inputs',
};
