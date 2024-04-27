import axios from 'axios';

export const mockPdfData = {
  data: 'c2FsdXQ=',
  pdfData: {
    title: 'test.pdf',
  },
};

export const axiosdata = jest.spyOn(axios, 'get').mockResolvedValue({
  data: mockPdfData,
});