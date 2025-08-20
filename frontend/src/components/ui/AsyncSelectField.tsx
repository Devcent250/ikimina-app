import { components } from "react-select";
import Select from "react-select";
import { useQuery } from "react-query";
import { useMemo, useState } from "react";
import { useDebounce } from "react-use";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

function AsyncSelectField({
  label,
  errorMessage,
  hideErrorMessage,
  disabled,
  loader,
  name,
  value,
  defaultOptions = [],
  ...other
}: any) {
  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    500,
    [search]
  );

  const fetch = async (e) => {
    const search = e.queryKey[2].search;
    return loader({ search });
  };

  const [open, setopen] = useState(false);

  const optionsQuery = useQuery({
    queryKey: ["options", name, { search: debouncedSearch }, other.key],
    queryFn: fetch,
    enabled: Boolean(open || value),
  });

  const isMulti = other?.isMulti;

  const valueMemo = useMemo(
    () =>
      isMulti
        ? optionsQuery?.data?.filter((e) => value.includes(e.value))
        : optionsQuery?.data?.find((e) => e.value === value) ||
          (typeof defaultOptions === "object" &&
            defaultOptions?.filter((e) => e?.value)) ||
          [],
    [isMulti, optionsQuery?.data, defaultOptions, value]
  );

  return (
    <div
      className={cn("py-md-", {
        "opacity-80": other?.isDisabled,
      })}
    >
      <ReactSelect
        menuIsOpen={open}
        isLoading={optionsQuery.status === "loading"}
        onMenuOpen={() => setopen(true)}
        onMenuClose={() => setopen(false)}
        filterOption={() => true}
        inputValue={search}
        value={valueMemo}
        onInputChange={(e) => setSearch(e)}
        options={optionsQuery?.data || []}
        name="colors"
        unstyled
        {...other}
      />
    </div>
  );
}

const DropdownIndicator = (props) => {
  return (
    <div {...props}>
      <ChevronDown size={15} className="text-slate-500" />
    </div>
  );
};

const ClearIndicator = (props) => {
  return (
    <div className="hidden" {...props}>
      <X size={15} className="text-slate-500" />
    </div>
  );
};

const MultiValueRemove = (props) => {
  return (
    <div {...props}>
      <X size={16} className="text-slate-600" />
    </div>
  );
};

function SingleValue(props) {
  return (
    <>
      {props?.data?.component ? (
        <components.SingleValue {...props}>
          <props.data.component />
        </components.SingleValue>
      ) : (
        <components.SingleValue {...props} />
      )}
    </>
  );
}

function Option(props) {
  return (
    <>
      {props.data.component ? (
        <components.Option {...props}>
          <props.data.component />
        </components.Option>
      ) : (
        <components.Option {...props} />
      )}
    </>
  );
}

const controlStyles = {
  base: "border rounded-md bg-slate-100 hover:cursor-pointer px-1 py-[4.5px]",
  focus: "border-primary ring-1- ring-primary-",
  nonFocus: "border-gray-200 hover:border-slate-200 hover:bg-slate-100",
};
const placeholderStyles = "text-gray-500 !text-[13px] pl-1 py-0.5";
const selectInputStyles = "pl-1 !text-[12.3px] text-slate-500 py-0.5";
const valueContainerStyles = "p-1 gap-1";
const singleValueStyles = "leading-7- text-[13px] text-slate-500 ml-1";
const multiValueStyles =
  "bg-gray-200 rounded-md items-center py-0.5 pl-2 pr-1 gap-1.5";
const multiValueLabelStyles = "leading-6 text-[13px] text-sla mr-1 py-0.5";
const multiValueRemoveStyles =
  "border border-gray-200 bg-white hover:bg-red-50 hover:text-red-800 text-gray-500 hover:border-red-300 rounded-md";
const indicatorsContainerStyles = "p-1 flex items-center gap-2";
const clearIndicatorStyles =
  "text-gray-500 p-1 rounded-md hover:bg-red-50 hover:text-red-800";
const indicatorSeparatorStyles = "bg-gray-200 mt-[4px] h-[18px]";
const dropdownIndicatorStyles =
  "p-1 hover:bg-gray-100 text-gray-500 rounded-md hover:text-black";
const menuStyles =
  "p-1 mt-2 border shadow-md !z-[10] border-gray-200 bg-white rounded-md";
const groupHeadingStyles = "ml-3 mt-2 mb-1 text-gray-500 text-sm";
const optionStyles = {
  base: "hover:cursor-pointer my-1 truncate flex text-slate-500 capitalize font-medium- !text-[12.3px] px-3 py-[8px] rounded-md",
  focus: "bg-gray-100 active:bg-gray-200",
  selected:
    "after:content-['✔'] !flex items-center bg-slate-100 after:ml-2 after:text-green-500 text-gray-500",
};
const noOptionsMessageStyles =
  "text-gray-500 p-2 text-[13px] font-medium- py-3  py-4 rounded-sm";

const loadingMessageStyles =
  "text-gray-500 p-2 text-[13px] font-medium- py-3  py-4 rounded-sm";

const ReactSelect = (props) => (
  <Select
    unstyled
    isClearable
    styles={{
      input: (base) => ({
        ...base,
        "input:focus": {
          boxShadow: "none",
        },
      }),
      // On mobile, the label will truncate automatically, so we want to
      // override that behaviour.
      // multiValueLabel: (base) => ({
      //   ...base,
      //   whiteSpace: "normal",
      //   overflow: "visible",
      // }),
      control: (base) => ({
        ...base,
        transition: "none",
      }),
    }}
    components={{
      DropdownIndicator,
      ClearIndicator,
      MultiValueRemove,
      // MultiValueLabel,
      SingleValue,
      Option,
    }}
    classNames={{
      control: ({ isFocused }) =>
        cn(
          isFocused ? controlStyles.focus : controlStyles.nonFocus,
          controlStyles.base,
          props.className,
          {
            "!border-red-500": props?.error,
          }
        ),
      placeholder: () => placeholderStyles,
      loadingMessage: () => loadingMessageStyles,
      input: () => selectInputStyles,
      valueContainer: () => valueContainerStyles,
      singleValue: () => singleValueStyles,
      multiValue: () => multiValueStyles,
      multiValueLabel: () => multiValueLabelStyles,
      multiValueRemove: () => multiValueRemoveStyles,
      indicatorsContainer: () => indicatorsContainerStyles,
      clearIndicator: () => clearIndicatorStyles,
      indicatorSeparator: () => indicatorSeparatorStyles,
      dropdownIndicator: () => dropdownIndicatorStyles,
      menu: () => menuStyles,
      groupHeading: () => groupHeadingStyles,
      option: ({ isFocused, isSelected }) =>
        cn(
          isFocused && optionStyles.focus,
          isSelected && optionStyles.selected,
          optionStyles.base
        ),
      noOptionsMessage: () => noOptionsMessageStyles,
    }}
    {...props}
  />
);

export default AsyncSelectField;
