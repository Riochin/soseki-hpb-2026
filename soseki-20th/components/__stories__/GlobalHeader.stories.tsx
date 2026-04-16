import type { Meta, StoryObj } from "@storybook/react";
import GlobalHeader from "../GlobalHeader";

const meta: Meta<typeof GlobalHeader> = {
  title: "Components/GlobalHeader",
  component: GlobalHeader,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    coins: { control: { type: "number", min: 0 } },
    debt: { control: { type: "number", min: 0 } },
    visible: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof GlobalHeader>;

export const Default: Story = {
  args: {
    coins: 500,
    debt: 0,
    visible: true,
  },
};

export const WithDebt: Story = {
  args: {
    coins: 0,
    debt: 300,
    visible: true,
  },
};

export const Hidden: Story = {
  args: {
    coins: 500,
    debt: 0,
    visible: false,
  },
};

export const RichCoins: Story = {
  args: {
    coins: 99999,
    debt: 0,
    visible: true,
  },
};
