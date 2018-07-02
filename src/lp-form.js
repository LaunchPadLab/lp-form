import React from 'react'
import { reduxForm } from 'redux-form'
import { 
  createFilterFunction, 
  wrapSubmissionPromise, 
  wrapDisplayName,
  createSubmittingOnChange,
  noop,
} from './utils'
import validate from './validate'

/**
 * A wrapper around the `reduxForm` HOC exported from
 * {@link https://www.npmjs.com/package/redux-form|redux-form} that gives it some extra functionality:
 *
 * 1. Makes extra options available for configuring the form
 * 2. Wraps every rejected `onSubmit` in a `SubmissionError`. If the thrown error has an `errors` property, its value will be passed to `SubmissionError`.
 * 3. Provides a default `onSubmit` function that resolves successfully and logs a warning.
 *
 * The extra options that can be provided to `lpForm` are as follows:
 * 
 * @name lpForm
 * @type Function
 * @param {String} name - An alias for `"form"` - a unique identifier for the form. 
 * @param {Object} initialValuesFilters - An object with an `allow` or `reject` key pointing to an array of attribute names. 
 * The indicated attributes will be omitted from the form's `initialValues`.
 * @param {Object} submitFilters - Another filter object that will be used to filter the form values that are submitted.
 * @param {Object} constraints - Contraints that will be used to validate the form using the {@link validate} function.
 * @param {Boolean=false} submitOnChange - A flag indicating whether the form should submit every time it's changed.
 * @param {Boolean=true} fullMessages - A flag indicating whether to prepend error messages with the input name.
 * 
 * @example
 *
 * import { Field } from 'redux-form'
 * import { lpForm } from 'lp-form'
 * import { Input, SubmitButton } from 'lp-components'
 * 
 * function MyForm ({ handleSubmit }) {
 *    return (
 *      <form onSubmit={ handleSubmit }>
 *        <Field name="name" component={ Input } />
 *        <SubmitButton> I'll submit the form! </SubmitButton>
 *      </form>
 *    )
 * }
 * 
 * export default compose(
 *    lpForm({
 *      name: 'my-form',
 *      initialValuesFilters: { reject: ['id'] },
 *      constraints: { name: { presence: true } },
 *    })
 * )(MyForm)
 * 
 */

 function defaultOnSubmit (...args) {
  // eslint-disable-next-line no-console
  console.warn('WARNING: no onSubmit function specified. Form will submit successfully by default.')
  return Promise.resolve(...args)
 }

function lpForm (options={}) {
  return Wrapped => {
    const WrappedWithForm = reduxForm()(Wrapped)
    function Wrapper (props) {
      const config = { ...options, ...props }
      const {
        name,
        initialValues,
        onSubmit=defaultOnSubmit,
        onChange=noop,
        submitOnChange=false,
        submitFilters,
        initialValuesFilters,
        constraints={},
        fullMessages=true,
        ...rest
      } = config
      const filterInitialValues = createFilterFunction(initialValuesFilters)
      const filterSubmitValues = createFilterFunction(submitFilters)
      const validateOptions = { fullMessages }
      const formProps = {
        form: name,
        initialValues: filterInitialValues(initialValues),
        onSubmit: (values, ...rest) => {
          const result = onSubmit(filterSubmitValues(values), ...rest)
          return wrapSubmissionPromise(result)
        },
        onChange: submitOnChange ? createSubmittingOnChange(onChange) : onChange,
        validate: validate(constraints, validateOptions),
        ...rest
      }
      return <WrappedWithForm {...{ ...props, ...formProps }} />
    }
    Wrapper.displayName = wrapDisplayName(Wrapped, 'lpForm')
    return Wrapper
  }
}

export default lpForm